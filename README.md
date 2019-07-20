# nodejs-async-tracking-example

This repo contains an example of tracking asynchronous operations with Node.js. It shows how to track async operations in a section of JavaScript code running under Node.js.

## Usage

To use, clone or download the repo, run `npm install` then `npm start`.

## Unexpected behavior

This example exhibits unusual behaviour and I'm trying to figure out why. 

In my application [Data-Forge Notebook](data-forge-notebook.com) I want it to track asynchronous operations across the evaluation of a JavaScript notebook to know when the notebook's evaluation has completed.

[Node.js async hooks API](https://nodejs.org/api/async_hooks.html) seems like a great way to do this, but the way I'm using it causes the program to abort in an unusual way.

The intention of the code src/index.js is that `** 33 **` should be printed out before this program ends. On successful completion it should also print `Done`. If there was an error it should print `An error occurred` followed by the error message. But none of these messages are printed out, so this means the program terminates abnormally.

My questions is: why does this program terminate abnormally? 

What is my code doing that causes this problem?

I've added event handlers for `uncaughtException` and `unhandledRejection` on the `process` object and these don't get triggered!

If you can help please email me on [ashley@codecapers.com.au](mailto:ashley@codecapers.com.au) or tweet me [ashleydavis75](https://twitter.com/ashleydavis75).
