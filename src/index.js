const { AsyncTracker } = require("./async-tracker");
const fs = require("fs");

process.on('uncaughtException', (err) => {
    fs.writeSync(1, '************* uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    fs.writeSync(1, '************* unhandledRejection');
});

async function main() {

    const asyncTracker = new AsyncTracker();
    asyncTracker.init();
    asyncTracker.enableTracking(); // Enable async operation tracking.

    // ---- Async operations created from here on are tracked.

    fs.writeSync(1, `** 11 **\n`); // Have to use this instead of console.log so that I don't cause extra async operations.
     
    // The simplest async operation that causes this problem.
    // If you comment out this code the program completes normally.
    await Promise.resolve(); 

    // This is another way of doing it.
    // await new Promise((resolve, reject) => {
    //     resolve();
    // });

    // This next line of code is an example of an async operation that works
    // the way I expect, the program waits 5 seconds then terminates normally.
    // setTimeout(() => {}, 5000);

    fs.writeSync(1, `** 22 **\n`);

    // ---  Now we disable tracking of async operations, then wait for all current operations to complete before continuing.

    asyncTracker.awaitCurrentAsyncOperations(() => { // Disable async tracking and trigger callback later.
        console.log("All async operations have completed.");
    }); 

    fs.writeSync(1, `** 33 **\n`);
}

main()
    .then(() => {
        console.log("Done");
    })
    .catch(err => {
        console.error("An error occurred.");
        console.error(err && err.stack || err);
    });
