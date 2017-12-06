# TypeScript User Service

[![CircleCI](https://circleci.com/gh/webstrap/typescript-userservice.svg?style=svg)](https://circleci.com/gh/webstrap/typescript-userservice)

This is a generic user service that supports:

 - Create/Read/Update/Delete Users and Roles
 - Login via Google
 - Send Messages between Users
 TODO: Facebook and Email/Password
 TODO: unique index on mongo not working

The purpose of this project is to create a mostly TypeScript based stack, that can serve as a base project, which provides at least example usage for the most important patterns.

## Supports Features/Patterns
 - Types
 - IDE Debugging of TypeScript Code
 - File Update Watcher (for automatic restart on file changes)
 - Data Layer
    - Schemas for MongoDB
    - Data Access centralised with repositories
    - Object Document Mapper (ODM/ORM) 
    - User Input Validation
    - Data Output Control
 - Dependency Injection (TODO: currently only via constructor injection)
 - Unit/Api Tests + Coverage Report
 - Authentication / OAuth
 - Authorization / Role Based Access Control
 - Configurable (allow for different configuration layer)
 - Security

## Stack / Libraries
 - TypeScript: Gives you Types in JavaScript, which allows you to use an IDE (I would recommend [Visual Studio Code](../.vscode)) to see what parameter a function expects and jump to the definition.
 - MongoDB: Document based data store with flexible schema, most common database in JS projects.
 - TypeORM: I tried Mongoose, but the model looked very convoluted. Additionally I prefer the Data Mapper Pattern over Active Record and prefered native TypeScript projects. 
 - TODO: TypeDI: Dependency Injection for JavaScript
 - accesscontrol: TypeScript role based authorization, looked as well at acl which looks solid, but I liked the explicit own vs any declaration and the attribute filters.
 - Express: I tried Restify, but the docs weren't good and mostly every other lib focuses on Express.
 - Passport: simple and flexible library to handle authentication provider.
 - Jest: everything you need for testing, test runner, code coverage, Mocks. It's by Facebook and is as well used for the react frontend.
 - Helmet: adds a lot of good defaults for protecting against clickjacking, cookie exploits and so on.

 ## Installation

  You can either use the Docker Setup or the Manual Setup. For local development I would recommend the Manual Setup, because it's easier to install/change modules in the package.json and debugging with the IDE is a bit simpler. But if you want to use the Docker Setup, you can as well attach the debugger and mount a volume in docker, for IDE Debugging and refresh inside the container without the need to restart/rebuild it.

### Configuration

 ### Docker Setup
  Prerequesites:
  - Install (Docker)[https://docs.docker.com/engine/installation/]

  Commands:
  - ```docker-compose up```

 ### Manual Setup
  Prerequesites:
    - Install Node >= 8.6.0 (ships with npm)
    - Install Yarn (optional, as you can use npm in the same way e.g. ```npm install```)
    - Install MongoDB

  Commands:
    - ```npm install```
    - ```npm test```
    - ```npm start```

## Application Design

| Folder        | Description          |
| ------------- |:-------------:|
| /.vscode           |     |
| /config           |     |
| /dist         |  contains only generated files, therefor on .gitignore|
| /docker/Dockerfile | |
| /src            |     |
| /src/config         |     |
| /src/controller            |     |
| /src/misc            |     |
| /src/model            |     |
| /src/types            |     |
| /test/api     |  |
| /test/unit     |  |
| /docker-compose.yml | |
| /package.json | |
| /tsconfig.json | |
| /tslint.json | |
  
### [Testing](./test)

### Error Messages

```Error: Entity metadata was not found``` This indicates, that some of the
entities imports are named wrongly (check case) and look [here](https://github.com/typeorm/typeorm/issues/420) for more information. Alternatively check if all entities are declared/found in the typeorm config.

```Argument of type '{}' is not assignable to parameter of type 'string'``` As it states, you try to use the wrong type. If you are still want to pass that object, you can use ```variable as any``` to get around the type checking.
