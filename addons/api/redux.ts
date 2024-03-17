interface MiddlewareAPI<S, A> {
  getState: () => S;
  dispatch: (action: A) => void;
}

type Middleware<S, A> = (api: MiddlewareAPI<S, A>) => (next: (action: A) => void) => (action: A) => void;

export default async function ({addon, console}) {
    addon.redux = {};
    class ReDucks {
        static compose<S, A> (...composeArgs: ((arg: S) => S)[]): (arg: S) => S {
            if (composeArgs.length === 0) return (args: S) => args;
            return (args: S) => {
                const composeArgsReverse = composeArgs.slice(0).reverse();
                let result = composeArgsReverse.shift()!(args);
                for (const fn of composeArgsReverse) {
                    result = fn(result);
                }
                return result;
            };
        }

        static applyMiddleware<S, A> (...middlewares: Middleware<S, A>[]) {
            return (createStore: (...args: any[]) => { dispatch: (action: A) => void; getState: () => S }) =>
                (...createStoreArgs: any[]) => {
                    const store = createStore(...createStoreArgs);
                    let { dispatch } = store;
                    const api: MiddlewareAPI<S, A> = {
                        getState: store.getState,
                        dispatch: (action: A) => dispatch(action),
                    };
                    const initialized = middlewares.map((middleware) => middleware(api));
                    dispatch = ReDucks.compose(...initialized)(store.dispatch);
                    return Object.assign({}, store, { dispatch });
                };
        }
    }

    let newerCompose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;

    function compose<S, A> (...args: any[]): (arg: S) => S {
        const addonRedux = addon.redux;
        const reduxTarget: EventTarget = (addonRedux.target = new EventTarget());
        addonRedux.state = {};
        addonRedux.dispatch = () => {};

        function middleware ({ getState, dispatch }: MiddlewareAPI<S, A>) {
            addonRedux.dispatch = dispatch;
            addonRedux.state = getState();
            return (next: (action: A) => void) => (action: A) => {
                const nextReturn = next(action);
                const ev = new CustomEvent('statechanged', {
                    detail: {
                        prev: addonRedux.state,
                        next: (addonRedux.state = getState()),
                        action,
                    },
                });
                reduxTarget.dispatchEvent(ev);
                return nextReturn;
            };
        }

        args.splice(1, 0, ReDucks.applyMiddleware<S, A>(middleware));
        return newerCompose ? newerCompose.apply(this, args) : ReDucks.compose.apply(this, args);
    }

    Object.defineProperty(window, '__REDUX_DEVTOOLS_EXTENSION_COMPOSE__', {
        get: () => compose,
        set: (v) => {
            newerCompose = v;
        },
    });
}
