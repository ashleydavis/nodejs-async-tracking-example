const async_hooks = require("async_hooks");
const fs = require("fs");

process.on('exit', code => { 
    console.log(`$$ Process exited with code ${code}.`);
});

process.on('uncaughtException', (err) => { 
    console.error('$$ uncaughtException');
    console.error(err && err.stack || err);
});

process.on('unhandledRejection', (reason, promise) => { 
    console.error('$$ unhandledRejection');
    console.error('Unhandled Rejection at: ', promise, ', reason: ', reason);
});

process.on('multipleResolves', (type, promise, reason) => { 
    console.error('$$ multipleResolves');
    console.error(type, promise, reason);
});

//
// Helper for tracking asyncronous operations.
//

class AsyncTracker {

    constructor() { 
        this.trackAsyncOperations = false;
        this.asyncOperations = new Set();
        this.openAsyncOperations = new Map();
    }

    //
    // Initialise the tracker.
    //
    init() {

        //
        // Create the async hook.
        //
        this.asyncHook = async_hooks.createHook({ 
            init: (asyncId, type, triggerAsyncId, resource) => {
                //fs.writeSync(1, `%% init ${asyncId} ${type} ${triggerAsyncId} ${typeof(resource)}\n`);           
                this.addAsyncOperation(asyncId, type);
            },
            // before: asyncId => {
            //     if (trackAsyncOperations) {
            //         fs.writeSync(1, `%% before ${asyncId}\n`);
            //     }
            // },
            after: asyncId => {
                //fs.writeSync(1, `%% after ${asyncId}\n`);
                this.removeAsyncOperation(asyncId);
            },
            destroy: asyncId => {
                //fs.writeSync(1, `%% destroy ${asyncId}\n`);
                this.removeAsyncOperation(asyncId);
            },
            promiseResolve: asyncId => {
                //fs.writeSync(1, `%% promiseResolve ${asyncId}\n`);
                this.removeAsyncOperation(asyncId);
            },
        });

        this.asyncHook.enable();
    }
    
    //
    // Deinitialize the tracker.
    //
    deinit() {
        if (this.asyncHook) {
            this.asyncHook.disable();
            delete this.asyncHook;
        }
    }

    //
    // Remove an async operation.
    //
    addAsyncOperation(asyncId, type) {
        if (this.trackAsyncOperations) {
            this.asyncOperations.add(asyncId);
            this.openAsyncOperations.set(asyncId, type);

            fs.writeSync(1, `%% added async operation #${asyncId}, now have ${this.asyncOperations.size} async ops.\n`);

            //fs.writeSync(1, new Error().stack!.toString() + "\n");
        }
        else {
            // fs.writeSync(1, `%% not currently tracking async operations.\n`);
        }
    }

    //
    // Add an async operation.
    //
    removeAsyncOperation(asyncId) {
        if (this.asyncOperations.has(asyncId)) {
            this.asyncOperations.delete(asyncId);
            this.openAsyncOperations.delete(asyncId);

            fs.writeSync(1, `%% removed async operation #${asyncId}\n`);
            this.dumpOperations();
    
            if (this.callback && 
                this.asyncOperations.size <= 0) {
                fs.writeSync(1, `%% resolving the async op promise!\n`);
                this.callback();
                this.callback = undefined;
            }
        }
    }

    //
    // Enable tracking of async operations.
    //
    enableTracking() {
        fs.writeSync(1, `!! Enabled async tracking.\n`);
        this.asyncOperations.clear();
        this.callback = undefined;
        this.trackAsyncOperations = true;    
    }

    //
    // Wait until all current async operations have completed.
    //
    awaitCurrentAsyncOperations(callback) {
    
        // At this point we stop tracking new async operations.
        // We don't care about any async op started after this point.
        this.trackAsyncOperations = false; 
        this.callback = callback;

        fs.writeSync(1, `>>>>>>> Code section has ended, async operation tracking has been disabled, currently have ${this.asyncOperations.size} async ops in progress.\n`);
        if (this.asyncOperations.size > 0) {
            fs.writeSync(1, `Waiting for operations to complete, creating a promise.\n`);
            this.dumpOperations();
            this.callback = callback;
        }
        else {
            this.asyncOperationsAwaitResolver = undefined;
            fs.writeSync(1, `No async ops in progress, no need to wait.\n`);
            callback();
        }
    }

    dumpOperations() {
        fs.writeSync(1, `!! Have ${this.openAsyncOperations.size} remaining async operations:\n`);
        for (const op of this.openAsyncOperations) {
            fs.writeSync(1, `  #${op[0]} - ${op[1]}.\n`);
        }
    }
}

module.exports = {
    AsyncTracker,
};