# Contest Platform - Test Cases Summary

This document lists all automated test cases that will be run against your backend implementation.

## Prerequisites
- Your server must be running on `http://localhost:3000` (or set `TEST_BASE_URL` environment variable)
- Database should be fresh/clean before running tests
- Run tests with: `npm test`

---

## Test Statistics

| Category | Test Count |
|----------|------------|
| Auth (Signup & Login) | 19 tests |
| Contests (Create & Get) | 18 tests |
| MCQ (Create & Submit) | 20 tests |
| DSA (Create, Get & Submit) | 20 tests |
| DSA Status Verification | 7 tests |
| Leaderboard | 5 tests |
| Contest Time Restrictions | 4 tests |
| Response Format Strictness | 5 tests |
| Edge Cases & Authorization | 10+ tests |
| **Total** | **108+ tests** |

---

## 1. POST /api/auth/signup (10 tests)

| # | Test Case | Expected Status | Expected Error |
|---|-----------|-----------------|----------------|
| 1 | Register creator successfully | 201 | - |
| 2 | Register contestee successfully | 201 | - |
| 3 | Default role is contestee when not provided | 201 | role: "contestee" |
| 4 | Duplicate email | 400 | EMAIL_ALREADY_EXISTS |
| 5 | Missing email | 400 | INVALID_REQUEST |
| 6 | Missing password | 400 | INVALID_REQUEST |
| 7 | Missing name | 400 | INVALID_REQUEST |
| 8 | Invalid email format | 400 | INVALID_REQUEST |
| 9 | Invalid role (not creator/contestee) | 400 | INVALID_REQUEST |
| 10 | Empty body | 400 | INVALID_REQUEST |

---

## 2. POST /api/auth/login (9 tests)

| # | Test Case | Expected Status | Expected Error |
|---|-----------|-----------------|----------------|
| 1 | Login creator successfully | 200 | - |
| 2 | Login contestee successfully | 200 | - |
| 3 | Wrong password | 401 | INVALID_CREDENTIALS |
| 4 | Non-existent email | 401 | INVALID_CREDENTIALS |
| 5 | Missing email | 400 | INVALID_REQUEST |
| 6 | Missing password | 400 | INVALID_REQUEST |
| 7 | Empty body | 400 | INVALID_REQUEST |
| 8 | Invalid email format | 400 | INVALID_REQUEST |

---

## 3. POST /api/contests (9 tests)

| # | Test Case | Expected Status | Expected Error |
|---|-----------|-----------------|----------------|
| 1 | Create contest as creator | 201 | - |
| 2 | No token provided | 401 | UNAUTHORIZED |
| 3 | Invalid token | 401 | UNAUTHORIZED |
| 4 | Contestee tries to create | 403 | FORBIDDEN |
| 5 | Missing title | 400 | INVALID_REQUEST |
| 6 | Missing description | 400 | INVALID_REQUEST |
| 7 | Missing startTime | 400 | INVALID_REQUEST |
| 8 | Missing endTime | 400 | INVALID_REQUEST |
| 9 | Invalid date format | 400 | INVALID_REQUEST |

---

## 4. GET /api/contests/:contestId (7 tests)

| # | Test Case | Expected Status | Expected Error |
|---|-----------|-----------------|----------------|
| 1 | Get contest details | 200 | - |
| 2 | No token provided | 401 | UNAUTHORIZED |
| 3 | Invalid token | 401 | UNAUTHORIZED |
| 4 | Non-existent contest ID | 404 | CONTEST_NOT_FOUND |
| 5 | Invalid contest ID format | 404 | CONTEST_NOT_FOUND |
| 6 | MCQs should NOT include correctOptionIndex | 200 | - |
| 7 | DSA problems are included | 200 | - |

---

## 5. POST /api/contests/:contestId/mcq (11 tests)

| # | Test Case | Expected Status | Expected Error |
|---|-----------|-----------------|----------------|
| 1 | Add MCQ as creator | 201 | - |
| 2 | No token provided | 401 | UNAUTHORIZED |
| 3 | Contestee tries to add MCQ | 403 | FORBIDDEN |
| 4 | Non-existent contest | 404 | CONTEST_NOT_FOUND |
| 5 | Missing questionText | 400 | INVALID_REQUEST |
| 6 | Missing options | 400 | INVALID_REQUEST |
| 7 | Missing correctOptionIndex | 400 | INVALID_REQUEST |
| 8 | Non-array options | 400 | INVALID_REQUEST |
| 9 | correctOptionIndex out of bounds | 400 | INVALID_REQUEST |
| 10 | Negative correctOptionIndex | 400 | INVALID_REQUEST |
| 11 | Empty options array | 400 | INVALID_REQUEST |

---

## 6. POST /api/contests/:contestId/mcq/:questionId/submit (10 tests)

| # | Test Case | Expected Status | Expected Error |
|---|-----------|-----------------|----------------|
| 1 | Submit correct answer | 201 | isCorrect: true |
| 2 | Submit incorrect answer | 201 | isCorrect: false, pointsEarned: 0 |
| 3 | Duplicate submission | 400 | ALREADY_SUBMITTED |
| 4 | No token provided | 401 | UNAUTHORIZED |
| 5 | Creator submitting to own contest | 403 | FORBIDDEN |
| 6 | Non-existent question | 404 | QUESTION_NOT_FOUND |
| 7 | Missing selectedOptionIndex | 400 | INVALID_REQUEST |
| 8 | Negative selectedOptionIndex | 400 | INVALID_REQUEST |
| 9 | Non-integer selectedOptionIndex | 400 | INVALID_REQUEST |
| 10 | Question from different contest | 404 | QUESTION_NOT_FOUND |

---

## 7. POST /api/contests/:contestId/dsa (11 tests)

| # | Test Case | Expected Status | Expected Error |
|---|-----------|-----------------|----------------|
| 1 | Add DSA problem with test cases | 201 | - |
| 2 | No token provided | 401 | UNAUTHORIZED |
| 3 | Contestee tries to add DSA | 403 | FORBIDDEN |
| 4 | Non-existent contest | 404 | CONTEST_NOT_FOUND |
| 5 | Missing title | 400 | INVALID_REQUEST |
| 6 | Missing description | 400 | INVALID_REQUEST |
| 7 | Missing testCases | 400 | INVALID_REQUEST |
| 8 | Empty testCases array | 400 | INVALID_REQUEST |
| 9 | Test case missing input | 400 | INVALID_REQUEST |
| 10 | Test case missing expectedOutput | 400 | INVALID_REQUEST |
| 11 | Non-array tags | 400 | INVALID_REQUEST |

---

## 8. GET /api/problems/:problemId (6 tests)

| # | Test Case | Expected Status | Expected Error |
|---|-----------|-----------------|----------------|
| 1 | Get problem with ONLY visible test cases | 200 | - |
| 2 | Hidden test cases NEVER returned | 200 | - |
| 3 | No token provided | 401 | UNAUTHORIZED |
| 4 | Invalid token | 401 | UNAUTHORIZED |
| 5 | Non-existent problem | 404 | PROBLEM_NOT_FOUND |
| 6 | Invalid problem ID | 404 | PROBLEM_NOT_FOUND |

**CRITICAL:** This test verifies that hidden test cases are NEVER exposed to users.

---

## 9. POST /api/problems/:problemId/submit (9 tests)

| # | Test Case | Expected Status | Expected Error |
|---|-----------|-----------------|----------------|
| 1 | Submit DSA solution | 201 | status in [accepted, wrong_answer, time_limit_exceeded, runtime_error] |
| 2 | Multiple submissions allowed | 201 | - |
| 3 | No token provided | 401 | UNAUTHORIZED |
| 4 | Creator submitting to own contest | 403 | FORBIDDEN |
| 5 | Non-existent problem | 404 | PROBLEM_NOT_FOUND |
| 6 | Missing code | 400 | INVALID_REQUEST |
| 7 | Missing language | 400 | INVALID_REQUEST |
| 8 | Empty code | 400 | INVALID_REQUEST |
| 9 | Points calculation: floor((passed/total) * points) | 201 | - |

---

## 10. GET /api/contests/:contestId/leaderboard (5 tests)

| # | Test Case | Expected Status | Expected Error |
|---|-----------|-----------------|----------------|
| 1 | Get leaderboard with rankings | 200 | - |
| 2 | Sorted by points descending | 200 | - |
| 3 | Same points = same rank | 200 | - |
| 4 | No token provided | 401 | UNAUTHORIZED |
| 5 | Non-existent contest | 404 | CONTEST_NOT_FOUND |

**Leaderboard Calculation:**
- Sum all MCQ points earned
- For DSA: take MAX points across all submissions per problem
- Total = MCQ points + sum of best DSA submissions
- Sort descending, assign ranks (equal points = equal rank)

---

## 11. DSA Submission Status Verification (7 tests)

| # | Test Case | Expected Status | Description |
|---|-----------|-----------------|-------------|
| 1 | Submit correct solution | 201 | status: "accepted", full points |
| 2 | Submit incorrect solution | 201 | status: "wrong_answer", partial/zero points |
| 3 | Submit slow/timeout solution | 201 | status: "time_limit_exceeded" |
| 4 | Submit code with runtime errors | 201 | status: "runtime_error", 0 points |
| 5 | Submit code with syntax errors | 201 | status: "runtime_error" |
| 6 | Submit code with null pointer errors | 201 | status: "runtime_error" |
| 7 | Partial pass with points calculation | 201 | status: "accepted" or "wrong_answer", correct points |

**Status Types:**
- `accepted`: All test cases passed
- `wrong_answer`: Some/all test cases failed with incorrect output
- `time_limit_exceeded`: Code exceeded timeLimit (2000ms for Two Sum)
- `runtime_error`: Code crashed, threw exception, or had syntax errors

**Points Calculation:**
- `Math.floor((testCasesPassed / totalTestCases) * problemPoints)`
- Runtime error = 0 points
- Partial pass = proportional points

---

## Contest Time Window Tests (4 tests)

| # | Test Case | Expected Status | Expected Error |
|---|-----------|-----------------|----------------|
| 1 | MCQ submission to expired contest | 400 | CONTEST_NOT_ACTIVE |
| 2 | MCQ submission to future contest | 400 | CONTEST_NOT_ACTIVE |
| 3 | DSA submission to expired contest | 400 | CONTEST_NOT_ACTIVE |
| 4 | DSA submission to future contest | 400 | CONTEST_NOT_ACTIVE |

---

## Response Format Strictness (5 tests)

All responses MUST follow this exact format:

```json
{
  "success": true | false,
  "data": {} | null,
  "error": "ERROR_CODE" | null
}
```

| # | Test Case | Requirement |
|---|-----------|-------------|
| 1 | Success response has exactly 3 keys | success, data, error |
| 2 | Error response has exactly 3 keys | success, data, error |
| 3 | Error must be a string | NOT an object |
| 4 | Success response has error: null | - |
| 5 | Error response has data: null | - |

---

## Authorization Edge Cases

| # | Test Case | Expected Behavior |
|---|-----------|-------------------|
| 1 | Creator can submit to another creator's contest | Allowed |
| 2 | Authorization header without "Bearer " prefix | 401 UNAUTHORIZED |
| 3 | Empty Authorization header | 401 UNAUTHORIZED |
| 4 | Tampered/expired JWT token | 401 UNAUTHORIZED |

---

## Error Codes Reference

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| INVALID_REQUEST | 400 | Schema validation failed |
| EMAIL_ALREADY_EXISTS | 400 | Email already registered |
| ALREADY_SUBMITTED | 400 | MCQ already answered |
| CONTEST_NOT_ACTIVE | 400 | Outside contest time window |
| UNAUTHORIZED | 401 | Missing/invalid JWT token |
| INVALID_CREDENTIALS | 401 | Wrong email/password |
| FORBIDDEN | 403 | Role not allowed for action |
| CONTEST_NOT_FOUND | 404 | Contest doesn't exist |
| QUESTION_NOT_FOUND | 404 | MCQ question doesn't exist |
| PROBLEM_NOT_FOUND | 404 | DSA problem doesn't exist |

---

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# With custom server URL
TEST_BASE_URL=http://localhost:5000 npm test
```

---

## Tips for Students

1. **Response format is strict** - No extra keys, error must be string
2. **Timestamps must be ISO 8601** - `2026-01-20T10:00:00Z`
3. **Hidden test cases must NEVER be exposed** - Critical security requirement
4. **Creators cannot submit to their own contests** - Check contest creator_id
5. **DSA allows multiple submissions, MCQ does not** - UNIQUE constraint on MCQ
6. **Points calculation for DSA** - `Math.floor((passed / total) * points)`
7. **Leaderboard uses MAX points for DSA** - Best submission counts
8. **DSA submission must return valid status** - One of: `accepted`, `wrong_answer`, `time_limit_exceeded`, `runtime_error`
9. **Runtime errors include syntax errors** - Any code that fails to execute properly
10. **Time limits must be enforced** - Solutions exceeding timeLimit should return `time_limit_exceeded`

Good luck!

