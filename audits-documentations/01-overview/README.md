# ATHENEA - tactical engineering & Data Network Project Management

## Overview
ATHENEA is a comprehensive multi-platform application designed for managing tactical engineering and data network projects. It provides real-time collaboration, offline functionality, and role-based access control for teams ranging from technicians to project managers.

### Getting stated:

> 📦 Make sure you are using at least node version 18.

1. Install the node package dependencies by typing: `$ npm install`

2. Create a .env file by typing `$ cp .env.example .env`

3. Start coding! and the vite dev server with live reload by typing: `$ npm run start`


### Styling

You can update the `./index.css` or create new `.css` files and import them into your current css or js files depending on your needs.

### Components

Add more files into your `./src/components` or styles folder as you need them and import them into your current files as needed.

💡Note: There is an example using the Context API inside `pages/demo.js`;

### Pages

Add more files into your `./js/pages` and import them in `./routes.jsx`.
Each page must match at least one route inside `routes.jsx`

### Centralized Store with useReducer

This template comes with a centralized & general state that's shared with all pages and compoentes, we call it "the store".   

The file `./src/store.js` has a default structure for the store, we encourage you to change it and adapt it to your data needs (for example, if you are doing a `Todo list` you will probably have a array of todos here).

+ Learn how the useReducer works.
+ Read more about implementing a global state with Context API
+ Read more about react hooks

The store `Provider` for this context is already set on `./src/main.jsx`. You can access the store from any component using the `useGlobalReducer` hook to get the `store` and `dispatcher`. Check `/views/demo.js` to see a demo. Here is a smaller sample:

```jsx
import useGlobalReducer from "./src/hooks/useGlobalReducer";

const MyComponentSuper = () => {
  //here you use the hook to get dispatcher and store
  import { dispatch, store } = useGlobalReducer();

  return <div>{/* you can use your actions or store inside the html */}</div>
}
```

## Publish your website!

1. **Vercel:** The FREE recomended hosting provider is [vercel.com](https://vercel.com/), you can deploy in 1 minutes by typing the following 2 commands:

Login (you need to have an account):
```sh
$ npm i vercel -g && vercel login
```
Deploy:
```sh
$ vercel --prod
```
✎ Note: If you don't have an account just go to vercel.com, create a account and come back here.

## Contributors

This template was built by AlphaDev and Gabriel Zavarse. This software is proprietary to AlphaDev and is intended for exclusive use by AlphaDev only.
