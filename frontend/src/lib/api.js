/**
 * API Client — Thin wrapper around fetch for backend communication.
 * Automatically attaches auth token and handles JSON.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  constructor() {
    this.baseUrl = API_URL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  _headers(isFormData = false) {
    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  async _request(method, path, body = null, isFormData = false) {
    const url = `${this.baseUrl}${path}`;
    const options = {
      method,
      headers: this._headers(isFormData),
    };

    if (body) {
      options.body = isFormData ? body : JSON.stringify(body);
    }

    const res = await fetch(url, options);

    // Handle binary responses (audio, images)
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('audio/') || contentType.includes('image/')) {
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      return {
        blob: await res.blob(),
        headers: Object.fromEntries(res.headers.entries()),
      };
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || `API Error: ${res.status}`);
    }
    return data;
  }

  // --- Auth ---
  signup(email, password, fullName) {
    return this._request('POST', '/api/auth/signup', { email, password, full_name: fullName });
  }

  login(email, password) {
    return this._request('POST', '/api/auth/login', { email, password });
  }

  // --- Parent Auth (Stubbed for future backend implementation) ---
  async loginParent(parentId, studentId) {
    /* 
     * TODO: Needs backend implementation - POST /api/auth/parent-login
     * This endpoint should accept (parentId, studentId) and return a parent-scoped session/token.
     */
    if (!parentId?.trim() || !studentId?.trim()) {
      throw new Error('Parent ID and Student ID are both required.');
    }
    
    // Scaffolding demo return
    return {
      parent_id: parentId.trim(),
      student_id: studentId.trim(),
      access_token: `parent_token_${parentId.trim()}`,
      user: {
        id: parentId.trim(),
        student_id: studentId.trim(),
        role: 'parent',
        name: `Parent (${parentId.trim()})`,
      },
    };
  }

  getMe() {
    return this._request('GET', '/api/auth/me');
  }

  updateProfile(data) {
    return this._request('PUT', '/api/auth/profile', data);
  }

  // --- Learning Paths ---
  getSubjects() {
    return this._request('GET', '/api/learning/subjects');
  }

  createLearningPath(subject, gradeLevel) {
    return this._request('POST', '/api/learning/path', { subject, grade_level: gradeLevel });
  }

  getLearningPaths() {
    return this._request('GET', '/api/learning/paths');
  }

  getLearningPath(pathId) {
    return this._request('GET', `/api/learning/path/${pathId}`);
  }

  updateTopicProgress(pathId, topicId, masteryLevel) {
    return this._request('PUT', `/api/learning/path/${pathId}/progress`, {
      topic_id: topicId,
      mastery_level: masteryLevel,
    });
  }

  // --- Tutor ---
  sendChat(message, sessionId = null, subject = '', topic = '') {
    return this._request('POST', '/api/tutor/chat', {
      message,
      session_id: sessionId,
      subject,
      topic,
    });
  }

  getChatHistory(sessionId) {
    return this._request('GET', `/api/tutor/history/${sessionId}`);
  }

  getChatSessions() {
    return this._request('GET', '/api/tutor/sessions');
  }

  deleteChatSession(sessionId) {
    return this._request('DELETE', `/api/tutor/session/${sessionId}`);
  }

  async sendVoice(audioBlob, sessionId = '', subject = '') {
    const formData = new FormData();
    const filename = audioBlob.type?.includes('wav') ? 'recording.wav' : 'recording.webm';
    formData.append('audio', audioBlob, filename);
    formData.append('session_id', sessionId);
    formData.append('subject', subject);
    return this._request('POST', '/api/tutor/voice', formData, true);
  }

  async analyzeImage(imageFile, prompt = '') {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('prompt', prompt);
    return this._request('POST', '/api/tutor/visual', formData, true);
  }

  async generateVisual(description, context = '') {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('context', context);
    return this._request('POST', '/api/tutor/generate-visual', formData, true);
  }

  // --- Documents ---
  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this._request('POST', '/api/documents/upload', formData, true);
  }

  queryDocuments(question) {
    return this._request('POST', '/api/documents/query', { question });
  }

  listDocuments() {
    return this._request('GET', '/api/documents/list');
  }

  deleteDocument(documentId) {
    return this._request('DELETE', `/api/documents/${documentId}`);
  }

  // --- Exams & Adaptive Practice ---
  generateExam(topicTitleOrSubject, maybeTopicTitle = '', topicId = null, numMcq = 5) {
    // Support both (topicTitle) and (subject, topicTitle) signatures
    let topic_title = topicTitleOrSubject;
    let subject = maybeTopicTitle;
    if (maybeTopicTitle && !topicTitleOrSubject.includes(' ') && maybeTopicTitle.length > 0) {
      // If called with (subject, topicTitle)
      subject = topicTitleOrSubject;
      topic_title = maybeTopicTitle;
    }

    return this._request('POST', '/api/exams/generate', {
      subject: subject || '',
      topic_title: topic_title || '',
      topic_id: topicId,
      num_mcq: numMcq,
    });
  }

  generateAdaptivePractice() {
    return this._request('POST', '/api/exams/adaptive');
  }

  getMasteryMap(subject = '') {
    const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
    return this._request('GET', `/api/exams/mastery-map${query}`);
  }

  submitExam(examId, answers) {
    return this._request('POST', '/api/exams/submit', {
      exam_id: examId,
      answers,
    });
  }

  getExamHistory() {
    return this._request('GET', '/api/exams/history');
  }

  getExamReport(examId) {
    return this._request('GET', `/api/exams/${examId}/report`);
  }

  // --- Teacher & Active Flagging Agent ---
  async loginTeacher(teacherId, classId) {
    /* 
     * TODO: Needs backend production implementation - POST /api/teacher/login
     * Currently connects to working scaffolding endpoint.
     */
    return this._request('POST', '/api/teacher/login', {
      teacher_id: teacherId,
      class_id: classId,
    });
  }

  getClassRoster() {
    return this._request('GET', '/api/teacher/roster');
  }

  getStudentFlags() {
    return this._request('GET', '/api/teacher/flags');
  }

  // --- Dashboard ---
  getDashboardOverview() {
    return this._request('GET', '/api/dashboard/overview');
  }

  getSubjectProgress(subject) {
    return this._request('GET', `/api/dashboard/progress/${subject}`);
  }

  getRecommendations() {
    return this._request('GET', '/api/dashboard/recommendations');
  }
}

export const api = new ApiClient();
