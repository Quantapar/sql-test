
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Helper function to make HTTP requests
async function request(method, path, body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers,
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();
  
  return {
    status: response.status,
    body: data,
  };
}

// Test data storage
let creatorToken = null;
let contesteeToken = null;
let contestee2Token = null;
let creatorId = null;
let contesteeId = null;
let contestee2Id = null;
let contestId = null;
let mcqQuestionId = null;
let dsaProblemId = null;

// Unique identifiers for this test run
const testRunId = Date.now();

describe('Contest Platform Backend Tests', () => {
  
  // ==========================================
  // RESPONSE FORMAT VALIDATION HELPERS
  // ==========================================
  
  function validateSuccessResponse(body, expectedData = null) {
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('error', null);
    expect(Object.keys(body).sort()).toEqual(['data', 'error', 'success']);
    
    if (expectedData) {
      expect(body.data).toMatchObject(expectedData);
    }
  }
  
  function validateErrorResponse(body, expectedError) {
    expect(body).toHaveProperty('success', false);
    expect(body).toHaveProperty('data', null);
    expect(body).toHaveProperty('error', expectedError);
    expect(typeof body.error).toBe('string');
    expect(Object.keys(body).sort()).toEqual(['data', 'error', 'success']);
  }
  
  // ==========================================
  // 1. POST /api/auth/signup
  // ==========================================
  
  describe('POST /api/auth/signup', () => {
    
    it('should register a creator successfully', async () => {
      const res = await request('POST', '/api/auth/signup', {
        name: 'Test Creator',
        email: `creator${testRunId}@test.com`,
        password: 'password123',
        role: 'creator',
      });
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name', 'Test Creator');
      expect(res.body.data).toHaveProperty('email', `creator${testRunId}@test.com`);
      expect(res.body.data).toHaveProperty('role', 'creator');
      expect(res.body.data).not.toHaveProperty('password');
      
      creatorId = res.body.data.id;
    });
    
    it('should register a contestee successfully', async () => {
      const res = await request('POST', '/api/auth/signup', {
        name: 'Test Contestee',
        email: `contestee${testRunId}@test.com`,
        password: 'password123',
        role: 'contestee',
      });
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('role', 'contestee');
      
      contesteeId = res.body.data.id;
    });
    
    it('should register a second contestee for leaderboard tests', async () => {
      const res = await request('POST', '/api/auth/signup', {
        name: 'Second Contestee',
        email: `contestee2_${testRunId}@test.com`,
        password: 'password123',
        role: 'contestee',
      });
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
      contestee2Id = res.body.data.id;
    });
    
    it('should default role to contestee if not provided', async () => {
      const res = await request('POST', '/api/auth/signup', {
        name: 'Default Role User',
        email: `defaultrole${testRunId}@test.com`,
        password: 'password123',
      });
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('role', 'contestee');
    });
    
    it('should return EMAIL_ALREADY_EXISTS for duplicate email', async () => {
      const res = await request('POST', '/api/auth/signup', {
        name: 'Duplicate User',
        email: `creator${testRunId}@test.com`,
        password: 'password123',
        role: 'creator',
      });
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'EMAIL_ALREADY_EXISTS');
    });
    
    it('should return INVALID_REQUEST for missing email', async () => {
      const res = await request('POST', '/api/auth/signup', {
        name: 'No Email User',
        password: 'password123',
      });
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for missing password', async () => {
      const res = await request('POST', '/api/auth/signup', {
        name: 'No Password User',
        email: `nopassword${testRunId}@test.com`,
      });
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for missing name', async () => {
      const res = await request('POST', '/api/auth/signup', {
        email: `noname${testRunId}@test.com`,
        password: 'password123',
      });
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for invalid email format', async () => {
      const res = await request('POST', '/api/auth/signup', {
        name: 'Invalid Email User',
        email: 'not-an-email',
        password: 'password123',
      });
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for invalid role', async () => {
      const res = await request('POST', '/api/auth/signup', {
        name: 'Invalid Role User',
        email: `invalidrole${testRunId}@test.com`,
        password: 'password123',
        role: 'admin',
      });
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for empty body', async () => {
      const res = await request('POST', '/api/auth/signup', {});
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
  });
  
  // ==========================================
  // 2. POST /api/auth/login
  // ==========================================
  
  describe('POST /api/auth/login', () => {
    
    it('should login creator successfully and return JWT token', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: `creator${testRunId}@test.com`,
        password: 'password123',
      });
      
      expect(res.status).toBe(200);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('token');
      expect(typeof res.body.data.token).toBe('string');
      expect(res.body.data.token.length).toBeGreaterThan(0);
      
      creatorToken = res.body.data.token;
    });
    
    it('should login contestee successfully and return JWT token', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: `contestee${testRunId}@test.com`,
        password: 'password123',
      });
      
      expect(res.status).toBe(200);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('token');
      
      contesteeToken = res.body.data.token;
    });
    
    it('should login second contestee successfully', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: `contestee2_${testRunId}@test.com`,
        password: 'password123',
      });
      
      expect(res.status).toBe(200);
      validateSuccessResponse(res.body);
      
      contestee2Token = res.body.data.token;
    });
    
    it('should return INVALID_CREDENTIALS for wrong password', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: `creator${testRunId}@test.com`,
        password: 'wrongpassword',
      });
      
      expect(res.status).toBe(401);
      validateErrorResponse(res.body, 'INVALID_CREDENTIALS');
    });
    
    it('should return INVALID_CREDENTIALS for non-existent email', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: 'nonexistent@test.com',
        password: 'password123',
      });
      
      expect(res.status).toBe(401);
      validateErrorResponse(res.body, 'INVALID_CREDENTIALS');
    });
    
    it('should return INVALID_REQUEST for missing email', async () => {
      const res = await request('POST', '/api/auth/login', {
        password: 'password123',
      });
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for missing password', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: `creator${testRunId}@test.com`,
      });
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for empty body', async () => {
      const res = await request('POST', '/api/auth/login', {});
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for invalid email format', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: 'not-valid-email',
        password: 'password123',
      });
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
  });
  
  // ==========================================
  // 3. POST /api/contests (Creator Only)
  // ==========================================
  
  describe('POST /api/contests', () => {
    
    const futureStartTime = new Date(Date.now() + 60000).toISOString(); // 1 minute from now
    const futureEndTime = new Date(Date.now() + 7200000).toISOString(); // 2 hours from now
    
    it('should create a contest successfully as creator', async () => {
      // Create contest that starts immediately and ends in 2 hours (for submission tests)
      const startTime = new Date(Date.now() - 60000).toISOString(); // Started 1 minute ago
      const endTime = new Date(Date.now() + 7200000).toISOString(); // Ends in 2 hours
      
      const res = await request('POST', '/api/contests', {
        title: 'Test Contest',
        description: 'Test Description',
        startTime: startTime,
        endTime: endTime,
      }, creatorToken);
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('title', 'Test Contest');
      expect(res.body.data).toHaveProperty('description', 'Test Description');
      expect(res.body.data).toHaveProperty('creatorId', creatorId);
      expect(res.body.data).toHaveProperty('startTime');
      expect(res.body.data).toHaveProperty('endTime');
      
      contestId = res.body.data.id;
    });
    
    it('should return UNAUTHORIZED without token', async () => {
      const res = await request('POST', '/api/contests', {
        title: 'Test Contest',
        description: 'Test Description',
        startTime: futureStartTime,
        endTime: futureEndTime,
      });
      
      expect(res.status).toBe(401);
      validateErrorResponse(res.body, 'UNAUTHORIZED');
    });
    
    it('should return UNAUTHORIZED with invalid token', async () => {
      const res = await request('POST', '/api/contests', {
        title: 'Test Contest',
        description: 'Test Description',
        startTime: futureStartTime,
        endTime: futureEndTime,
      }, 'invalid-token-here');
      
      expect(res.status).toBe(401);
      validateErrorResponse(res.body, 'UNAUTHORIZED');
    });
    
    it('should return FORBIDDEN when contestee tries to create contest', async () => {
      const res = await request('POST', '/api/contests', {
        title: 'Contestee Contest',
        description: 'Should fail',
        startTime: futureStartTime,
        endTime: futureEndTime,
      }, contesteeToken);
      
      expect(res.status).toBe(403);
      validateErrorResponse(res.body, 'FORBIDDEN');
    });
    
    it('should return INVALID_REQUEST for missing title', async () => {
      const res = await request('POST', '/api/contests', {
        description: 'Test Description',
        startTime: futureStartTime,
        endTime: futureEndTime,
      }, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for missing description', async () => {
      const res = await request('POST', '/api/contests', {
        title: 'Test Contest',
        startTime: futureStartTime,
        endTime: futureEndTime,
      }, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for missing startTime', async () => {
      const res = await request('POST', '/api/contests', {
        title: 'Test Contest',
        description: 'Test Description',
        endTime: futureEndTime,
      }, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for missing endTime', async () => {
      const res = await request('POST', '/api/contests', {
        title: 'Test Contest',
        description: 'Test Description',
        startTime: futureStartTime,
      }, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for invalid date format', async () => {
      const res = await request('POST', '/api/contests', {
        title: 'Test Contest',
        description: 'Test Description',
        startTime: 'not-a-date',
        endTime: futureEndTime,
      }, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for empty body', async () => {
      const res = await request('POST', '/api/contests', {}, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
  });
  
  // ==========================================
  // 4. GET /api/contests/:contestId
  // ==========================================
  
  describe('GET /api/contests/:contestId', () => {
    
    it('should get contest details successfully', async () => {
      const res = await request('GET', `/api/contests/${contestId}`, null, contesteeToken);
      
      expect(res.status).toBe(200);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('id', contestId);
      expect(res.body.data).toHaveProperty('title', 'Test Contest');
      expect(res.body.data).toHaveProperty('description', 'Test Description');
      expect(res.body.data).toHaveProperty('startTime');
      expect(res.body.data).toHaveProperty('endTime');
      expect(res.body.data).toHaveProperty('creatorId', creatorId);
      expect(res.body.data).toHaveProperty('mcqs');
      expect(res.body.data).toHaveProperty('dsaProblems');
      expect(Array.isArray(res.body.data.mcqs)).toBe(true);
      expect(Array.isArray(res.body.data.dsaProblems)).toBe(true);
    });
    
    it('should return UNAUTHORIZED without token', async () => {
      const res = await request('GET', `/api/contests/${contestId}`);
      
      expect(res.status).toBe(401);
      validateErrorResponse(res.body, 'UNAUTHORIZED');
    });
    
    it('should return UNAUTHORIZED with invalid token', async () => {
      const res = await request('GET', `/api/contests/${contestId}`, null, 'invalid-token');
      
      expect(res.status).toBe(401);
      validateErrorResponse(res.body, 'UNAUTHORIZED');
    });
    
    it('should return CONTEST_NOT_FOUND for non-existent contest', async () => {
      const res = await request('GET', '/api/contests/99999', null, contesteeToken);
      
      expect(res.status).toBe(404);
      validateErrorResponse(res.body, 'CONTEST_NOT_FOUND');
    });
    
    it('should return CONTEST_NOT_FOUND for invalid contest ID', async () => {
      const res = await request('GET', '/api/contests/invalid-id', null, contesteeToken);
      
      expect(res.status).toBe(404);
      validateErrorResponse(res.body, 'CONTEST_NOT_FOUND');
    });
  });
  
  // ==========================================
  // 5. POST /api/contests/:contestId/mcq (Creator Only)
  // ==========================================
  
  describe('POST /api/contests/:contestId/mcq', () => {
    
    it('should add MCQ question successfully as creator', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq`, {
        questionText: 'What is the time complexity of binary search?',
        options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'],
        correctOptionIndex: 1,
        points: 5,
      }, creatorToken);
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('contestId', contestId);
      
      mcqQuestionId = res.body.data.id;
    });
    
    it('should add second MCQ for leaderboard tests', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq`, {
        questionText: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctOptionIndex: 1,
        points: 3,
      }, creatorToken);
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
    });
    
    it('should return UNAUTHORIZED without token', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq`, {
        questionText: 'Test Question',
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 0,
        points: 1,
      });
      
      expect(res.status).toBe(401);
      validateErrorResponse(res.body, 'UNAUTHORIZED');
    });
    
    it('should return FORBIDDEN when contestee tries to add MCQ', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq`, {
        questionText: 'Test Question',
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 0,
        points: 1,
      }, contesteeToken);
      
      expect(res.status).toBe(403);
      validateErrorResponse(res.body, 'FORBIDDEN');
    });
    
    it('should return CONTEST_NOT_FOUND for non-existent contest', async () => {
      const res = await request('POST', '/api/contests/99999/mcq', {
        questionText: 'Test Question',
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 0,
        points: 1,
      }, creatorToken);
      
      expect(res.status).toBe(404);
      validateErrorResponse(res.body, 'CONTEST_NOT_FOUND');
    });
    
    it('should return INVALID_REQUEST for missing questionText', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq`, {
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 0,
        points: 1,
      }, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for missing options', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq`, {
        questionText: 'Test Question',
        correctOptionIndex: 0,
        points: 1,
      }, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for missing correctOptionIndex', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq`, {
        questionText: 'Test Question',
        options: ['A', 'B', 'C', 'D'],
        points: 1,
      }, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for non-array options', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq`, {
        questionText: 'Test Question',
        options: 'not-an-array',
        correctOptionIndex: 0,
        points: 1,
      }, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for invalid correctOptionIndex (out of bounds)', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq`, {
        questionText: 'Test Question',
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 5,
        points: 1,
      }, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for negative correctOptionIndex', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq`, {
        questionText: 'Test Question',
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: -1,
        points: 1,
      }, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for empty options array', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq`, {
        questionText: 'Test Question',
        options: [],
        correctOptionIndex: 0,
        points: 1,
      }, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
  });
  
  // ==========================================
  // 7. POST /api/contests/:contestId/dsa (Creator Only)
  // ==========================================
  
  describe('POST /api/contests/:contestId/dsa', () => {
    
    it('should add DSA problem with test cases successfully', async () => {
      const res = await request('POST', `/api/contests/${contestId}/dsa`, {
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        tags: ['array', 'hash-table'],
        points: 100,
        timeLimit: 2000,
        memoryLimit: 256,
        testCases: [
          {
            input: "2\n4 9\n2 7 11 15\n3 6\n3 2 4",
            expectedOutput: "0 1\n1 2",
            isHidden: false,
          },
          {
            input: "3\n2 6\n3 3\n5 10\n1 4 5 6 9\n4 8\n2 2 2 2",
            expectedOutput: "0 1\n0 2\n1 3",
            isHidden: true,
          },
        ],
      }, creatorToken);
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('contestId', contestId);
      
      dsaProblemId = res.body.data.id;
    });
    
    it('should return UNAUTHORIZED without token', async () => {
      const res = await request('POST', `/api/contests/${contestId}/dsa`, {
        title: 'Test Problem',
        description: 'Test description',
        tags: ['test'],
        points: 50,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [
          { input: '1\n5', expectedOutput: '5', isHidden: false }
        ],
      });
      
      expect(res.status).toBe(401);
      validateErrorResponse(res.body, 'UNAUTHORIZED');
    });
    
    it('should return FORBIDDEN when contestee tries to add DSA problem', async () => {
      const res = await request('POST', `/api/contests/${contestId}/dsa`, {
        title: 'Test Problem',
        description: 'Test description',
        tags: ['test'],
        points: 50,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [
          { input: '1\n5', expectedOutput: '5', isHidden: false }
        ],
      }, contesteeToken);
      
      expect(res.status).toBe(403);
      validateErrorResponse(res.body, 'FORBIDDEN');
    });
    
    it('should return CONTEST_NOT_FOUND for non-existent contest', async () => {
      const res = await request('POST', '/api/contests/99999/dsa', {
        title: 'Test Problem',
        description: 'Test description',
        tags: ['test'],
        points: 50,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [
          { input: '1\n5', expectedOutput: '5', isHidden: false }
        ],
      }, creatorToken);
      
      expect(res.status).toBe(404);
      validateErrorResponse(res.body, 'CONTEST_NOT_FOUND');
    });
    
    it('should return INVALID_REQUEST for missing title', async () => {
      const res = await request('POST', `/api/contests/${contestId}/dsa`, {
        description: 'Test description',
        tags: ['test'],
        points: 50,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [
          { input: '1\n5', expectedOutput: '5', isHidden: false }
        ],
      }, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for missing description', async () => {
      const res = await request('POST', `/api/contests/${contestId}/dsa`, {
        title: 'Test Problem',
        tags: ['test'],
        points: 50,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [
          { input: '1\n5', expectedOutput: '5', isHidden: false }
        ],
      }, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for missing testCases', async () => {
      const res = await request('POST', `/api/contests/${contestId}/dsa`, {
        title: 'Test Problem',
        description: 'Test description',
        tags: ['test'],
        points: 50,
        timeLimit: 1000,
        memoryLimit: 128,
      }, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for empty testCases array', async () => {
      const res = await request('POST', `/api/contests/${contestId}/dsa`, {
        title: 'Test Problem',
        description: 'Test description',
        tags: ['test'],
        points: 50,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [],
      }, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for test case missing input', async () => {
      const res = await request('POST', `/api/contests/${contestId}/dsa`, {
        title: 'Test Problem',
        description: 'Test description',
        tags: ['test'],
        points: 50,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [{ expectedOutput: '5', isHidden: false }],
      }, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for test case missing expectedOutput', async () => {
      const res = await request('POST', `/api/contests/${contestId}/dsa`, {
        title: 'Test Problem',
        description: 'Test description',
        tags: ['test'],
        points: 50,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [{ input: '1\n5', isHidden: false }],
      }, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for non-array tags', async () => {
      const res = await request('POST', `/api/contests/${contestId}/dsa`, {
        title: 'Test Problem',
        description: 'Test description',
        tags: 'not-an-array',
        points: 50,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [
          { input: '1\n5', expectedOutput: '5', isHidden: false }
        ],
      }, creatorToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
  });
  
  // ==========================================
  // 8. GET /api/problems/:problemId
  // ==========================================
  
  describe('GET /api/problems/:problemId', () => {
    
    it('should get DSA problem details with visible test cases only', async () => {
      const res = await request('GET', `/api/problems/${dsaProblemId}`, null, contesteeToken);
      
      expect(res.status).toBe(200);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('id', dsaProblemId);
      expect(res.body.data).toHaveProperty('contestId', contestId);
      expect(res.body.data).toHaveProperty('title', 'Two Sum');
      expect(res.body.data).toHaveProperty('description');
      expect(res.body.data).toHaveProperty('tags');
      expect(res.body.data).toHaveProperty('points', 100);
      expect(res.body.data).toHaveProperty('timeLimit', 2000);
      expect(res.body.data).toHaveProperty('memoryLimit', 256);
      expect(res.body.data).toHaveProperty('visibleTestCases');
      expect(Array.isArray(res.body.data.visibleTestCases)).toBe(true);
      
      // Verify only visible test cases are returned (isHidden: false)
      expect(res.body.data.visibleTestCases.length).toBe(1);
      expect(res.body.data.visibleTestCases[0]).toHaveProperty('input');
      expect(res.body.data.visibleTestCases[0]).toHaveProperty('expectedOutput');
      
      // CRITICAL: Hidden test cases must NEVER be exposed
      expect(res.body.data).not.toHaveProperty('testCases');
      res.body.data.visibleTestCases.forEach(tc => {
        expect(tc).not.toHaveProperty('isHidden');
      });
    });
    
    it('should return UNAUTHORIZED without token', async () => {
      const res = await request('GET', `/api/problems/${dsaProblemId}`);
      
      expect(res.status).toBe(401);
      validateErrorResponse(res.body, 'UNAUTHORIZED');
    });
    
    it('should return UNAUTHORIZED with invalid token', async () => {
      const res = await request('GET', `/api/problems/${dsaProblemId}`, null, 'invalid-token');
      
      expect(res.status).toBe(401);
      validateErrorResponse(res.body, 'UNAUTHORIZED');
    });
    
    it('should return PROBLEM_NOT_FOUND for non-existent problem', async () => {
      const res = await request('GET', '/api/problems/99999', null, contesteeToken);
      
      expect(res.status).toBe(404);
      validateErrorResponse(res.body, 'PROBLEM_NOT_FOUND');
    });
    
    it('should return PROBLEM_NOT_FOUND for invalid problem ID', async () => {
      const res = await request('GET', '/api/problems/invalid-id', null, contesteeToken);
      
      expect(res.status).toBe(404);
      validateErrorResponse(res.body, 'PROBLEM_NOT_FOUND');
    });
  });
  
  // ==========================================
  // Verify contest includes MCQs and DSA problems (after adding them)
  // ==========================================
  
  describe('GET /api/contests/:contestId (with questions)', () => {
    
    it('should include MCQs without correctOptionIndex for contestees', async () => {
      const res = await request('GET', `/api/contests/${contestId}`, null, contesteeToken);
      
      expect(res.status).toBe(200);
      validateSuccessResponse(res.body);
      expect(res.body.data.mcqs.length).toBeGreaterThan(0);
      
      // MCQs should NOT include correctOptionIndex for contestees
      res.body.data.mcqs.forEach(mcq => {
        expect(mcq).toHaveProperty('id');
        expect(mcq).toHaveProperty('questionText');
        expect(mcq).toHaveProperty('options');
        expect(mcq).toHaveProperty('points');
        expect(mcq).not.toHaveProperty('correctOptionIndex');
      });
    });
    
    it('should include DSA problems', async () => {
      const res = await request('GET', `/api/contests/${contestId}`, null, contesteeToken);
      
      expect(res.status).toBe(200);
      validateSuccessResponse(res.body);
      expect(res.body.data.dsaProblems.length).toBeGreaterThan(0);
      
      res.body.data.dsaProblems.forEach(problem => {
        expect(problem).toHaveProperty('id');
        expect(problem).toHaveProperty('title');
        expect(problem).toHaveProperty('description');
        expect(problem).toHaveProperty('tags');
        expect(problem).toHaveProperty('points');
        expect(problem).toHaveProperty('timeLimit');
        expect(problem).toHaveProperty('memoryLimit');
      });
    });
  });
  
  // ==========================================
  // 6. POST /api/contests/:contestId/mcq/:questionId/submit (Contestee Only)
  // ==========================================
  
  describe('POST /api/contests/:contestId/mcq/:questionId/submit', () => {
    
    it('should submit correct MCQ answer successfully as contestee', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq/${mcqQuestionId}/submit`, {
        selectedOptionIndex: 1,
      }, contesteeToken);
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('isCorrect', true);
      expect(res.body.data).toHaveProperty('pointsEarned', 5);
    });
    
    it('should submit incorrect MCQ answer and return 0 points', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq/${mcqQuestionId}/submit`, {
        selectedOptionIndex: 0, // Wrong answer
      }, contestee2Token);
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('isCorrect', false);
      expect(res.body.data).toHaveProperty('pointsEarned', 0);
    });
    
    it('should return ALREADY_SUBMITTED for duplicate submission', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq/${mcqQuestionId}/submit`, {
        selectedOptionIndex: 1,
      }, contesteeToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'ALREADY_SUBMITTED');
    });
    
    it('should return UNAUTHORIZED without token', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq/${mcqQuestionId}/submit`, {
        selectedOptionIndex: 1,
      });
      
      expect(res.status).toBe(401);
      validateErrorResponse(res.body, 'UNAUTHORIZED');
    });
    
    it('should return FORBIDDEN when creator tries to submit to own contest', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq/${mcqQuestionId}/submit`, {
        selectedOptionIndex: 1,
      }, creatorToken);
      
      expect(res.status).toBe(403);
      validateErrorResponse(res.body, 'FORBIDDEN');
    });
    
    it('should return QUESTION_NOT_FOUND for non-existent question', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq/99999/submit`, {
        selectedOptionIndex: 1,
      }, contesteeToken);
      
      expect(res.status).toBe(404);
      validateErrorResponse(res.body, 'QUESTION_NOT_FOUND');
    });
    
    it('should return INVALID_REQUEST for missing selectedOptionIndex', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq/${mcqQuestionId}/submit`, {}, contesteeToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for negative selectedOptionIndex', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq/${mcqQuestionId}/submit`, {
        selectedOptionIndex: -1,
      }, contesteeToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for non-integer selectedOptionIndex', async () => {
      const res = await request('POST', `/api/contests/${contestId}/mcq/${mcqQuestionId}/submit`, {
        selectedOptionIndex: 'one',
      }, contesteeToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
  });
  
  // ==========================================
  // 9. POST /api/problems/:problemId/submit (Contestee Only)
  // ==========================================
  
  describe('POST /api/problems/:problemId/submit', () => {
    
    it('should submit DSA solution successfully', async () => {
      const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
        code: 'function twoSum(nums, target) { for(let i=0;i<nums.length;i++) for(let j=i+1;j<nums.length;j++) if(nums[i]+nums[j]===target) return [i,j]; }',
        language: 'javascript',
      }, contesteeToken);
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('status');
      expect(res.body.data).toHaveProperty('pointsEarned');
      expect(res.body.data).toHaveProperty('testCasesPassed');
      expect(res.body.data).toHaveProperty('totalTestCases');
      
      // Status should be one of the valid values
      expect(['accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error']).toContain(res.body.data.status);
      
      // Points calculation validation
      expect(typeof res.body.data.pointsEarned).toBe('number');
      expect(typeof res.body.data.testCasesPassed).toBe('number');
      expect(typeof res.body.data.totalTestCases).toBe('number');
      expect(res.body.data.testCasesPassed).toBeLessThanOrEqual(res.body.data.totalTestCases);
    });
    
    it('should allow multiple submissions for DSA problems', async () => {
      // Submit again (DSA allows multiple submissions unlike MCQ)
      const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
        code: 'function twoSum(nums, target) { return [0, 1]; }',
        language: 'javascript',
      }, contesteeToken);
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('status');
    });
    
    it('should return UNAUTHORIZED without token', async () => {
      const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
        code: 'function twoSum() {}',
        language: 'javascript',
      });
      
      expect(res.status).toBe(401);
      validateErrorResponse(res.body, 'UNAUTHORIZED');
    });
    
    it('should return FORBIDDEN when creator tries to submit to own contest problem', async () => {
      const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
        code: 'function twoSum() {}',
        language: 'javascript',
      }, creatorToken);
      
      expect(res.status).toBe(403);
      validateErrorResponse(res.body, 'FORBIDDEN');
    });
    
    it('should return PROBLEM_NOT_FOUND for non-existent problem', async () => {
      const res = await request('POST', '/api/problems/99999/submit', {
        code: 'function test() {}',
        language: 'javascript',
      }, contesteeToken);
      
      expect(res.status).toBe(404);
      validateErrorResponse(res.body, 'PROBLEM_NOT_FOUND');
    });
    
    it('should return INVALID_REQUEST for missing code', async () => {
      const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
        language: 'javascript',
      }, contesteeToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for missing language', async () => {
      const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
        code: 'function test() {}',
      }, contesteeToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
    
    it('should return INVALID_REQUEST for empty code', async () => {
      const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
        code: '',
        language: 'javascript',
      }, contesteeToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'INVALID_REQUEST');
    });
  });
  
  // ==========================================
  // 10. GET /api/contests/:contestId/leaderboard
  // ==========================================
  
  describe('GET /api/contests/:contestId/leaderboard', () => {
    
    it('should return leaderboard with correct rankings', async () => {
      const res = await request('GET', `/api/contests/${contestId}/leaderboard`, null, contesteeToken);
      
      expect(res.status).toBe(200);
      validateSuccessResponse(res.body);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      if (res.body.data.length > 0) {
        res.body.data.forEach(entry => {
          expect(entry).toHaveProperty('userId');
          expect(entry).toHaveProperty('name');
          expect(entry).toHaveProperty('totalPoints');
          expect(entry).toHaveProperty('rank');
          expect(typeof entry.userId).toBe('number');
          expect(typeof entry.name).toBe('string');
          expect(typeof entry.totalPoints).toBe('number');
          expect(typeof entry.rank).toBe('number');
        });
        
        // Verify sorted by points descending
        for (let i = 1; i < res.body.data.length; i++) {
          expect(res.body.data[i - 1].totalPoints).toBeGreaterThanOrEqual(res.body.data[i].totalPoints);
        }
        
        // Verify ranks are correct (same points = same rank)
        for (let i = 1; i < res.body.data.length; i++) {
          if (res.body.data[i].totalPoints === res.body.data[i - 1].totalPoints) {
            expect(res.body.data[i].rank).toBe(res.body.data[i - 1].rank);
          } else {
            expect(res.body.data[i].rank).toBeGreaterThan(res.body.data[i - 1].rank);
          }
        }
      }
    });
    
    it('should return UNAUTHORIZED without token', async () => {
      const res = await request('GET', `/api/contests/${contestId}/leaderboard`);
      
      expect(res.status).toBe(401);
      validateErrorResponse(res.body, 'UNAUTHORIZED');
    });
    
    it('should return UNAUTHORIZED with invalid token', async () => {
      const res = await request('GET', `/api/contests/${contestId}/leaderboard`, null, 'invalid-token');
      
      expect(res.status).toBe(401);
      validateErrorResponse(res.body, 'UNAUTHORIZED');
    });
    
    it('should return CONTEST_NOT_FOUND for non-existent contest', async () => {
      const res = await request('GET', '/api/contests/99999/leaderboard', null, contesteeToken);
      
      expect(res.status).toBe(404);
      validateErrorResponse(res.body, 'CONTEST_NOT_FOUND');
    });
    
    it('should return CONTEST_NOT_FOUND for invalid contest ID', async () => {
      const res = await request('GET', '/api/contests/invalid-id/leaderboard', null, contesteeToken);
      
      expect(res.status).toBe(404);
      validateErrorResponse(res.body, 'CONTEST_NOT_FOUND');
    });
  });
  
  // ==========================================
  // CONTEST NOT ACTIVE TESTS
  // ==========================================
  
  describe('Contest Time Window Restrictions', () => {
    
    let expiredContestId = null;
    let futureContestId = null;
    let expiredMcqId = null;
    let futureMcqId = null;
    let expiredDsaProblemId = null;
    let futureDsaProblemId = null;
    
    beforeAll(async () => {
      // Create an expired contest
      const pastStartTime = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
      const pastEndTime = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      
      const expiredRes = await request('POST', '/api/contests', {
        title: 'Expired Contest',
        description: 'Already ended',
        startTime: pastStartTime,
        endTime: pastEndTime,
      }, creatorToken);
      
      if (expiredRes.status === 201) {
        expiredContestId = expiredRes.body.data.id;
        
        // Add MCQ to expired contest
        const mcqRes = await request('POST', `/api/contests/${expiredContestId}/mcq`, {
          questionText: 'Expired question',
          options: ['A', 'B', 'C', 'D'],
          correctOptionIndex: 0,
          points: 1,
        }, creatorToken);
        if (mcqRes.status === 201) {
          expiredMcqId = mcqRes.body.data.id;
        }
        
        // Add DSA problem to expired contest
        const dsaRes = await request('POST', `/api/contests/${expiredContestId}/dsa`, {
          title: 'Expired Problem',
          description: 'Expired',
          tags: ['test'],
          points: 50,
          timeLimit: 1000,
          memoryLimit: 128,
          testCases: [
            { input: '1\n5', expectedOutput: '5', isHidden: false },
            { input: '2\n5\n10', expectedOutput: '5\n10', isHidden: true }
          ],
        }, creatorToken);
        if (dsaRes.status === 201) {
          expiredDsaProblemId = dsaRes.body.data.id;
        }
      }
      
      // Create a future contest (not started yet)
      const futureStartTime = new Date(Date.now() + 86400000).toISOString(); // 1 day from now
      const futureEndTime = new Date(Date.now() + 172800000).toISOString(); // 2 days from now
      
      const futureRes = await request('POST', '/api/contests', {
        title: 'Future Contest',
        description: 'Not started yet',
        startTime: futureStartTime,
        endTime: futureEndTime,
      }, creatorToken);
      
      if (futureRes.status === 201) {
        futureContestId = futureRes.body.data.id;
        
        // Add MCQ to future contest
        const mcqRes = await request('POST', `/api/contests/${futureContestId}/mcq`, {
          questionText: 'Future question',
          options: ['A', 'B', 'C', 'D'],
          correctOptionIndex: 0,
          points: 1,
        }, creatorToken);
        if (mcqRes.status === 201) {
          futureMcqId = mcqRes.body.data.id;
        }
        
        // Add DSA problem to future contest
        const dsaRes = await request('POST', `/api/contests/${futureContestId}/dsa`, {
          title: 'Future Problem',
          description: 'Future',
          tags: ['test'],
          points: 50,
          timeLimit: 1000,
          memoryLimit: 128,
          testCases: [
            { input: '1\n5', expectedOutput: '5', isHidden: false },
            { input: '2\n5\n10', expectedOutput: '5\n10', isHidden: true }
          ],
        }, creatorToken);
        if (dsaRes.status === 201) {
          futureDsaProblemId = dsaRes.body.data.id;
        }
      }
    });
    
    it('should return CONTEST_NOT_ACTIVE for MCQ submission to expired contest', async () => {
      if (!expiredMcqId) {
        console.warn('Skipping test - expired contest setup failed');
        return;
      }
      
      const res = await request('POST', `/api/contests/${expiredContestId}/mcq/${expiredMcqId}/submit`, {
        selectedOptionIndex: 0,
      }, contesteeToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'CONTEST_NOT_ACTIVE');
    });
    
    it('should return CONTEST_NOT_ACTIVE for MCQ submission to future contest', async () => {
      if (!futureMcqId) {
        console.warn('Skipping test - future contest setup failed');
        return;
      }
      
      const res = await request('POST', `/api/contests/${futureContestId}/mcq/${futureMcqId}/submit`, {
        selectedOptionIndex: 0,
      }, contesteeToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'CONTEST_NOT_ACTIVE');
    });
    
    it('should return CONTEST_NOT_ACTIVE for DSA submission to expired contest', async () => {
      if (!expiredDsaProblemId) {
        console.warn('Skipping test - expired contest setup failed');
        return;
      }
      
      const res = await request('POST', `/api/problems/${expiredDsaProblemId}/submit`, {
        code: 'function test() {}',
        language: 'javascript',
      }, contesteeToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'CONTEST_NOT_ACTIVE');
    });
    
    it('should return CONTEST_NOT_ACTIVE for DSA submission to future contest', async () => {
      if (!futureDsaProblemId) {
        console.warn('Skipping test - future contest setup failed');
        return;
      }
      
      const res = await request('POST', `/api/problems/${futureDsaProblemId}/submit`, {
        code: 'function test() {}',
        language: 'javascript',
      }, contesteeToken);
      
      expect(res.status).toBe(400);
      validateErrorResponse(res.body, 'CONTEST_NOT_ACTIVE');
    });
  });
  
  // ==========================================
  // POINTS CALCULATION VERIFICATION
  // ==========================================
  
  describe('Points Calculation', () => {
    
    it('should calculate DSA points correctly: floor((passed / total) * points)', async () => {
      const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
        code: 'function twoSum(nums, target) { const map = {}; for(let i=0; i<nums.length; i++) { const diff = target - nums[i]; if(map[diff] !== undefined) return [map[diff], i]; map[nums[i]] = i; } }',
        language: 'javascript',
      }, contestee2Token);
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
      
      const { pointsEarned, testCasesPassed, totalTestCases } = res.body.data;
      const problemPoints = 100; // Points for Two Sum problem
      
      const expectedPoints = Math.floor((testCasesPassed / totalTestCases) * problemPoints);
      expect(pointsEarned).toBe(expectedPoints);
    });
  });
  
  // ==========================================
  // DSA SUBMISSION STATUS VERIFICATION
  // ==========================================
  
  describe('DSA Submission Status Tests', () => {
    
    it('should return ACCEPTED status for correct solution', async () => {
      // Correct Two Sum solution using hash map
      const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
        code: `
          function twoSum(nums, target) {
            const map = {};
            for(let i = 0; i < nums.length; i++) {
              const complement = target - nums[i];
              if(map[complement] !== undefined) {
                return [map[complement], i];
              }
              map[nums[i]] = i;
            }
            return [];
          }
        `,
        language: 'javascript',
      }, contesteeToken);
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('status', 'accepted');
      expect(res.body.data.testCasesPassed).toBe(res.body.data.totalTestCases);
      expect(res.body.data.pointsEarned).toBe(100); // Full points
    });
    
    it('should return WRONG_ANSWER status for incorrect solution', async () => {
      // Intentionally wrong solution - always returns [0, 1]
      const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
        code: `
          function twoSum(nums, target) {
            return [0, 1]; // Always returns [0, 1] regardless of input
          }
        `,
        language: 'javascript',
      }, contesteeToken);
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('status', 'wrong_answer');
      expect(res.body.data.testCasesPassed).toBeLessThan(res.body.data.totalTestCases);
    });
    
    it('should return TIME_LIMIT_EXCEEDED status for slow solution', async () => {
      // Intentionally slow solution with nested loops and additional delay
      const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
        code: `
          function twoSum(nums, target) {
            // Extremely slow O(n^3) solution with busy wait
            for(let i = 0; i < nums.length; i++) {
              for(let j = 0; j < nums.length; j++) {
                // Busy wait to cause timeout
                let sum = 0;
                for(let k = 0; k < 10000000; k++) {
                  sum += k;
                }
                if(nums[i] + nums[j] === target && i !== j) {
                  return [i, j];
                }
              }
            }
            return [];
          }
        `,
        language: 'javascript',
      }, contesteeToken);
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('status', 'time_limit_exceeded');
    });
    
    it('should return RUNTIME_ERROR status for code with errors', async () => {
      // Code that will throw runtime errors
      const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
        code: `
          function twoSum(nums, target) {
            // This will cause a runtime error
            return nums.nonExistentMethod();
          }
        `,
        language: 'javascript',
      }, contesteeToken);
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('status', 'runtime_error');
      expect(res.body.data.pointsEarned).toBe(0);
      expect(res.body.data.testCasesPassed).toBe(0);
    });
    
    it('should return RUNTIME_ERROR for syntax errors', async () => {
      const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
        code: `
          function twoSum(nums, target) {
            // Missing closing brace will cause syntax error
            return [0, 1];
        `,
        language: 'javascript',
      }, contesteeToken);
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('status', 'runtime_error');
    });
    
    it('should return RUNTIME_ERROR for null pointer errors', async () => {
      const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
        code: `
          function twoSum(nums, target) {
            // Accessing property of undefined
            let obj = null;
            return obj.property.map(x => x);
          }
        `,
        language: 'javascript',
      }, contesteeToken);
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('status', 'runtime_error');
    });
    
    it('should handle partial pass with correct points calculation', async () => {
      // Solution that might pass some test cases but not all
      const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
        code: `
          function twoSum(nums, target) {
            // Simple brute force - might work for some cases
            if(nums.length === 2) return [0, 1];
            for(let i = 0; i < Math.min(nums.length, 2); i++) {
              for(let j = i + 1; j < Math.min(nums.length, 3); j++) {
                if(nums[i] + nums[j] === target) {
                  return [i, j];
                }
              }
            }
            return [0, 1];
          }
        `,
        language: 'javascript',
      }, contesteeToken);
      
      expect(res.status).toBe(201);
      validateSuccessResponse(res.body);
      expect(['accepted', 'wrong_answer']).toContain(res.body.data.status);
      
      // Verify points calculation
      const { pointsEarned, testCasesPassed, totalTestCases } = res.body.data;
      const expectedPoints = Math.floor((testCasesPassed / totalTestCases) * 100);
      expect(pointsEarned).toBe(expectedPoints);
    });
  });
  
  // ==========================================
  // RESPONSE FORMAT STRICTNESS TESTS
  // ==========================================
  
  describe('Response Format Strictness', () => {
    
    it('success response should have exactly success, data, error keys', async () => {
      const res = await request('GET', `/api/contests/${contestId}`, null, contesteeToken);
      
      expect(res.status).toBe(200);
      const keys = Object.keys(res.body).sort();
      expect(keys).toEqual(['data', 'error', 'success']);
    });
    
    it('error response should have exactly success, data, error keys', async () => {
      const res = await request('GET', '/api/contests/99999', null, contesteeToken);
      
      expect(res.status).toBe(404);
      const keys = Object.keys(res.body).sort();
      expect(keys).toEqual(['data', 'error', 'success']);
    });
    
    it('error should be a string, not an object', async () => {
      const res = await request('GET', '/api/contests/99999', null, contesteeToken);
      
      expect(res.status).toBe(404);
      expect(typeof res.body.error).toBe('string');
      expect(res.body.error).not.toBeNull();
      expect(typeof res.body.error).not.toBe('object');
    });
    
    it('success response should have error as null', async () => {
      const res = await request('GET', `/api/contests/${contestId}`, null, contesteeToken);
      
      expect(res.status).toBe(200);
      expect(res.body.error).toBeNull();
    });
    
    it('error response should have data as null', async () => {
      const res = await request('GET', '/api/contests/99999', null, contesteeToken);
      
      expect(res.status).toBe(404);
      expect(res.body.data).toBeNull();
    });
  });
  
  // ==========================================
  // AUTHORIZATION EDGE CASES
  // ==========================================
  
  describe('Authorization Edge Cases', () => {
    
    let anotherCreatorToken = null;
    let anotherCreatorContestId = null;
    
    beforeAll(async () => {
      // Create another creator
      await request('POST', '/api/auth/signup', {
        name: 'Another Creator',
        email: `anothercreator${testRunId}@test.com`,
        password: 'password123',
        role: 'creator',
      });
      
      const loginRes = await request('POST', '/api/auth/login', {
        email: `anothercreator${testRunId}@test.com`,
        password: 'password123',
      });
      
      if (loginRes.status === 200) {
        anotherCreatorToken = loginRes.body.data.token;
        
        // Create a contest by another creator
        const startTime = new Date(Date.now() - 60000).toISOString();
        const endTime = new Date(Date.now() + 7200000).toISOString();
        
        const contestRes = await request('POST', '/api/contests', {
          title: 'Another Creator Contest',
          description: 'Test',
          startTime,
          endTime,
        }, anotherCreatorToken);
        
        if (contestRes.status === 201) {
          anotherCreatorContestId = contestRes.body.data.id;
        }
      }
    });
    
    it('creator should be able to submit to another creator\'s contest', async () => {
      // First, add an MCQ to another creator's contest
      const mcqRes = await request('POST', `/api/contests/${anotherCreatorContestId}/mcq`, {
        questionText: 'Test question for cross-creator test',
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 0,
        points: 1,
      }, anotherCreatorToken);
      
      if (mcqRes.status !== 201) {
        console.warn('Skipping test - could not create MCQ');
        return;
      }
      
      const mcqId = mcqRes.body.data.id;
      
      // Original creator tries to submit to another creator's contest MCQ
      // This should work because they're not the creator of THIS contest
      const submitRes = await request('POST', `/api/contests/${anotherCreatorContestId}/mcq/${mcqId}/submit`, {
        selectedOptionIndex: 0,
      }, creatorToken);
      
      // This should succeed because creatorToken is a creator but not of THIS contest
      expect(submitRes.status).toBe(201);
      validateSuccessResponse(submitRes.body);
    });
  });
  
  // ==========================================
  // MALFORMED REQUEST TESTS
  // ==========================================
  
  describe('Malformed Request Handling', () => {
    
    it('should handle null body gracefully', async () => {
      const res = await request('POST', '/api/auth/signup', null);
      expect(res.status).toBe(400);
    });
    
    it('should handle Authorization header without Bearer prefix', async () => {
      const response = await fetch(`${BASE_URL}/api/contests/${contestId}`, {
        method: 'GET',
        headers: {
          'Authorization': creatorToken, // Missing "Bearer " prefix
        },
      });
      
      const body = await response.json();
      expect(response.status).toBe(401);
      validateErrorResponse(body, 'UNAUTHORIZED');
    });
    
    it('should handle empty Authorization header', async () => {
      const response = await fetch(`${BASE_URL}/api/contests/${contestId}`, {
        method: 'GET',
        headers: {
          'Authorization': '',
        },
      });
      
      const body = await response.json();
      expect(response.status).toBe(401);
      validateErrorResponse(body, 'UNAUTHORIZED');
    });
    
    it('should handle expired/tampered JWT token', async () => {
      const tamperedToken = creatorToken ? creatorToken.slice(0, -5) + 'xxxxx' : 'tampered.jwt.token';
      const res = await request('GET', `/api/contests/${contestId}`, null, tamperedToken);
      
      expect(res.status).toBe(401);
      validateErrorResponse(res.body, 'UNAUTHORIZED');
    });
  });
  
  // ==========================================
  // TIMESTAMP FORMAT TESTS
  // ==========================================
  
  describe('Timestamp Format (ISO 8601)', () => {
    
    it('contest timestamps should be in ISO 8601 format', async () => {
      const res = await request('GET', `/api/contests/${contestId}`, null, contesteeToken);
      
      expect(res.status).toBe(200);
      
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
      expect(res.body.data.startTime).toMatch(isoRegex);
      expect(res.body.data.endTime).toMatch(isoRegex);
    });
  });
  
  // ==========================================
  // EDGE CASE: Question/Problem belongs to different contest
  // ==========================================
  
  describe('Resource Ownership Validation', () => {
    
    let differentContestId = null;
    let differentMcqId = null;
    
    beforeAll(async () => {
      const startTime = new Date(Date.now() - 60000).toISOString();
      const endTime = new Date(Date.now() + 7200000).toISOString();
      
      const contestRes = await request('POST', '/api/contests', {
        title: 'Different Contest',
        description: 'For ownership tests',
        startTime,
        endTime,
      }, creatorToken);
      
      if (contestRes.status === 201) {
        differentContestId = contestRes.body.data.id;
        
        const mcqRes = await request('POST', `/api/contests/${differentContestId}/mcq`, {
          questionText: 'Different contest question',
          options: ['A', 'B', 'C', 'D'],
          correctOptionIndex: 0,
          points: 1,
        }, creatorToken);
        
        if (mcqRes.status === 201) {
          differentMcqId = mcqRes.body.data.id;
        }
      }
    });
    
    it('should return QUESTION_NOT_FOUND when MCQ belongs to different contest', async () => {
      if (!differentMcqId) {
        console.warn('Skipping test - setup failed');
        return;
      }
      
      // Try to submit to MCQ using wrong contest ID
      const res = await request('POST', `/api/contests/${contestId}/mcq/${differentMcqId}/submit`, {
        selectedOptionIndex: 0,
      }, contesteeToken);
      
      expect(res.status).toBe(404);
      validateErrorResponse(res.body, 'QUESTION_NOT_FOUND');
    });
  });
});

