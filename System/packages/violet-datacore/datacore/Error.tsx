/**
 * Logs error to console, enable stack trace.
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 * @author Michael "Tres" Brenan <michael@brenan.dev>
 */

const { Component, createContext } = dc.preact;

/**
 * Render a pretty centered error message in a box.
 * Fetched from {@link https://github.com/blacksmithgu/datacore/blob/31a8b18b0978f8b06d03d6dabcf023a7362b56f2/src/ui/markdown.tsx#L277-L301}
 * @author Michael "Tres" Brenan <michael@brenan.dev>
 */
function ErrorMessage({
    title,
    message,
    error,
    reset,
}: {
    title?: string | VNode;
    message?: string | VNode;
    error?: string;
    reset?: () => void;
}) {
    return (
        <div className="datacore-error-box">
            {title && <h4 className="datacore-error-title">{title}</h4>}
            {message && <p className="datacore-error-message">{message}</p>}
            {error && <pre className="datacore-error-pre">{error}</pre>}
            {reset && (
                <button className="datacore-error-retry" onClick={reset}>
                    Rerun
                </button>
            )}
        </div>
    );
}

const ErrorContext = createContext({
    error: null,
    setError: () => {}
});

/**
 * Catches error and display errored component name and script path.
 * It is an `ErrorContext` consumer, to use this component, put it inside
 * `<ErrorContext.Provider />`, and supply `error` and `setError` to manage
 * error state. This allows the parent component to reset error when error is
 * resolved.
 * 
 * @example
 * function View() {
 *     const [error, setError] = useState(null);
 *     return (
 *         <ErrorContext.Provider value={{ error, setError }}>
 *             <LoggingErrorBoundary
 *                 componentName={Component.name}
 *                 path={scriptPath}
 *             >
 *                 <Component />
 *             </LoggingErrorBoundary>
 *         </ErrorContext.Provider>
 *     )
 * }
 */
class LoggingErrorBoundary extends Component {
    static contextType = ErrorContext;
    state = { error: null }

    componentDidCatch(error) {
        console.error(error);
        this.context.setError(() => error);
        this.setState({ error: error });  // End propagation
    }

    resetError = () => {
        this.context.setError(() => null);
    }
    
    render(props, state) {
        const { componentName, path, children } = props;
        const { error } = this.context;
        return error
            ? <ErrorMessage
                title={"Datacore script error"}
                message={<>
                    Failed to execute component <code>{componentName}</code> in:
                    <br />
                    <code>{path}</code>
                </>}
                error={error.stack}
                reset={this.resetError}
            />
            : children;
    }
}

return { ErrorMessage, ErrorContext, LoggingErrorBoundary };