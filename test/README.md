# Backend Testing

## Test Execution
To execute the Unit tests run

  ```npm test```

To execute the API tests run

  ```npm run test:api```

## Guidlines for this project
 - try to prefer unit tests over api test (Testing Pyramide)
 - try to write tests for the complex parts of the business logic, but there is
   no fixed value required for code coverage (even though it's meassured)
 - try to pass external dependencies that create connections to other services,
   like to the database or other web servers, as dependencies to the constructor
   to make its depdencies explicit and easier to replace it with mocks.
 - try to separate the data collection and parameter handling from the more complex
   business logic to make it easier testable
 - try to mock internal dependencies that have their own tests to make it easier 
   to isolate the location of the problems when you run the tests
 - try to not mock external dependencies  as long as they don't create connections
 - try to not use methods from /src to generate your expected result, since it might
   be you just test that the functions returns what the function returns

