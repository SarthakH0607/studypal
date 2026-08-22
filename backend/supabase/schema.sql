-- ============================================================
-- OOSC Database Schema — Supabase PostgreSQL
-- Run this in Supabase SQL Editor to create all tables & policies
-- ============================================================

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    grade_level TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    preferred_subjects TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. LEARNING PATHS
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    total_topics INT DEFAULT 0,
    completed_topics INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning paths"
    ON learning_paths FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own learning paths"
    ON learning_paths FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own learning paths"
    ON learning_paths FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own learning paths"
    ON learning_paths FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 3. LEARNING TOPICS
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    order_index INT NOT NULL DEFAULT 0,
    mastery_level TEXT DEFAULT 'not_started'
        CHECK (mastery_level IN ('not_started', 'in_progress', 'practiced', 'mastered')),
    prerequisites UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE learning_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own topics"
    ON learning_topics FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 4. CHAT SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Chat',
    subject TEXT DEFAULT '',
    topic_id UUID REFERENCES learning_topics(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chat sessions"
    ON chat_sessions FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 5. CHAT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own messages"
    ON chat_messages FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 6. DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT DEFAULT 'pdf',
    file_size INT DEFAULT 0,
    total_chunks INT DEFAULT 0,
    status TEXT DEFAULT 'processing'
        CHECK (status IN ('processing', 'ready', 'error')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own documents"
    ON documents FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 7. DOCUMENT CHUNKS (with vector embeddings)
-- ============================================================
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_index INT NOT NULL DEFAULT 0,
    embedding vector(1024),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chunks"
    ON document_chunks FOR ALL USING (auth.uid() = user_id);

-- HNSW index for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
    ON document_chunks
    USING hnsw (embedding vector_cosine_ops);

-- ============================================================
-- 8. EXAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES learning_topics(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    topic_title TEXT NOT NULL,
    total_questions INT DEFAULT 0,
    score REAL DEFAULT NULL,
    max_score REAL DEFAULT NULL,
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own exams"
    ON exams FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 9. EXAM QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'short_answer', 'long_answer')),
    question_text TEXT NOT NULL,
    options JSONB DEFAULT NULL,       -- For MCQ: ["A", "B", "C", "D"]
    correct_answer TEXT DEFAULT NULL,  -- For MCQ
    max_points REAL DEFAULT 1.0,
    order_index INT DEFAULT 0
);

-- No RLS needed — access controlled via exam ownership

-- ============================================================
-- 10. EXAM SUBMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS exam_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    answer TEXT DEFAULT '',
    points_awarded REAL DEFAULT 0,
    feedback TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE exam_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own submissions"
    ON exam_submissions FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- RPC: Vector similarity search for RAG
-- ============================================================
CREATE OR REPLACE FUNCTION match_document_chunks(
    query_embedding vector(1024),
    match_count INT DEFAULT 5,
    filter_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    content TEXT,
    chunk_index INT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.content,
        dc.chunk_index,
        dc.metadata,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    WHERE (filter_user_id IS NULL OR dc.user_id = filter_user_id)
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
