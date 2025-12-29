## How to Obtain the Source Code

To obtain the source code, you must clone the Github repository. Please follow the 1st step of the [Getting Started](/README.md#1-clone-the-repository) section for cloning the repository (only complete the 1st step).

## Directory Structure Layout
```
3504-term-project-things2do/  
├── .github/                    # GitHub specific files
│   ├── ISSUE_TEMPLATE/         # Templates for creating new issues (e.g., bug reports)
│   │
│   └── workflows/              # GitHub Actions workflows for CI/CD (e.g., ci.yml for continuous integration)
│
├── __mocks__/                  # Mocks for Jest tests (e.g., mocking style imports)
│
├── __tests__/                  # Contains test files for the application (using Jest/React Testing Library)
│
├── api/                        # Server-side API route handlers or functions
│
├── app/                        # Main application source code, using file-based routing (Expo Router)
│   ├── (auth)/                 # Route group for authentication screens (e.g., login, signup)
│   │
│   ├── (tabs)/                 # Route group for the main tab navigation
│   │
│   └── profile/                # Route group for profile sub-screens
│
├── assets/                     # Static assets for the application
│   ├── fonts/                  # Font files
│   │
│   └── images/                 # Image files (icons, logos, splash screens)
│
├── components/                 # Reusable React components used throughout the app
│   ├── thing-deck/             # Components specific to the 'thing-deck' feature
│   │
│   └── ui/                     # General-purpose UI components
│
├── constants/                  # Files for constant values
│
├── context/                    # React Context providers
│
├── hooks/                      # Custom React hooks
│
├── reports/                    # Directory for project reports (e.g., weekly progress)
│
├── scripts/                    # Utility scripts for the project
│
├── types/                      # Custom TypeScript type definitions
│
└── utils/                      # Utility functions
```

## How to Build the Software

>[!WARNING]
> We have not figured out how to actually build the mobile application (i.e., producing an apk), as the process has proven to be difficult. For now, treat running the mobile application the same as building it.

For building the software for development and testing, please refer to [Getting Started](/README.md#getting-started-runningbuilding-the-app) section in the README.

## How to Test the Software

Make sure you've completed steps 1 and 2 from the [Getting Started](/README.md#getting-started-runningbuilding-the-app) section, and you've navigated to the project's root directory in your CLI before running tests.

### Running All Tests

To run all pre-configured Jest tests, run this command:

```bash
npm run test
```

This will execute all of the tests files located in the ``__tests__`` directory.

### Running One Test

To run a specific test file from the `__tests__` directory, copy the command below and run it, making sure to replace `[filename]` with the specific test file you want to run:

```bash
npm run test -- __tests__/[filename]
```

This will execute the test file specified in the command that is located in the `__tests__` directory.

## How to Add New Tests

To add new tests within the repository:

1. Navigate to the `__tests__` directory from the project’s root directory.

2. Create your test file there.
- If you are creating a unit test that does not use React Native components, use the `[filename].test.ts` extension.
- If you are creating a component test, use the `[ComponentName].test.tsx` extension.

3. Go through the [Jest documentation](https://jestjs.io/docs/getting-started) to find what you need for your test.

- If you are doing a component test, also go through these documentations:
  - [React Native Testing Library](https://oss.callstack.com/react-native-testing-library/docs/api)
  - [Testing in Expo](https://docs.expo.dev/develop/unit-testing/) (ignore the installation steps)
  - [Testing in React Native](https://reactnative.dev/docs/testing-overview)
- If you are stuck on what to initially add to your tests, consider looking at the other tests within the `__tests__` directory for inspiration (e.g., `SavedEvent.test.tsx`).

## How to Build a Release of the Software

>[!IMPORTANT]
> Please read the [How to Build the Software](#how-to-build-the-software) section before preceding with this section.

If you are to build a new release of the mobile application, you must first increment and update the version number in a couple of files.

1. In the `app.json` file, there will be a "version" field that contains the current version number:

```json
{
  "expo": {
    "name": "things-2-do",
    "slug": "things-2-do",
    "version": "1.0.0-beta.1",
    ...
  }
}
```

2. Near the top of the `package.json` file, there will also be a "version" field that contains the current version number:

```json
{
  "name": "things-2-do",
  "main": "expo-router/entry",
  "version": "1.0.0-beta.1",
  ...
}
```

For both the `app.json` and `package.json` files, increment the number in that field based on the type of changes that were made in that version. (see the [section below](#software-versioning) for more information on how to increment the version number)

### Software Versioning

For the most part, this project follows the [Semantic Versioning](https://semver.org/) guidelines.

In general, the version number consists of three numerical parts: MAJOR.MINOR.PATH
- MAJOR is incremented by 1 when you make a major change to the project (e.g., UI overhaul)
- MINOR is incremented by 1 when a new feature is added
- PATH is incremented by 1 when a bug has been fixed

Prefixes can also be added at the end of the version number to denote that the build is a pre-release (e.g., 1.0.0-beta.1, 2.4.1-alpha.1, 0.8.1-rc.1)