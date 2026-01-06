/**
 * Logs error to console, enable stack trace.
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 * @author Michael "Tres" Brenan <michael@brenan.dev>
 */

const { Component, createContext } = dc.preact;
const { useState } = dc;

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
        const { error } = this.context;
        return error
            ? <ErrorMessage
                title={"Datacore script error"}
                message={<>
                    Failed to execute component <code>{props.componentName}</code> in:
                    <br />
                    <code>{props.path}</code>
                </>}
                error={error.stack}
                reset={this.resetError}
            />
            : props.children;
    }
}

return { ErrorMessage, ErrorContext, LoggingErrorBoundary };