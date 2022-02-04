
/// <reference types="react-scripts" />
// This is here so that TypeScript knows that an object called `eel` will exist (the script I've linked in `public/index.html` creates it) and doesn't complain.

interface Window {
  eel: any;
}

declare var window: Window;
