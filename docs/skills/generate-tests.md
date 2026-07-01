# Skill: generate-tests

**Mission:** Generate comprehensive tests for existing untested code.

**Inputs:**
- Source files to test
- Testing standards (docs/standards/testing.md)
- Existing test examples

**Outputs:**
- Test files (.test.mjs)
- Test coverage report

**Workflow:**
1. Analyze source file structure and exports
2. Identify testable units (services, functions, components)
3. Write happy path tests
4. Write error case tests
5. Write edge case tests
6. Write permission/authorization tests
7. Verify with `node --test`

**Validation:**
- Tests follow .test.mjs pattern
- All public functions tested
- Both success and error cases covered
- Tests are deterministic

**Deliverables:**
- Test files
- Verification
