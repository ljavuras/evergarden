/**
 * Add style and console log to components.
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

const { obsidian } = await cJS();  // Expose Obsidian API from CustomJS
const {
    app,
    useState,
    useEffect,
    useMemo,
    useRef,
} = dc;

const {
    ErrorMessage,
    ErrorContext,
    LoggingErrorBoundary,
} = await dc.load("violet-datacore", "Error");

/**
 * Injects related stylesheets and logs errors to the console.
 * 
 * Example file structure:
 * ```
 * path/to/component/
 * ├── Script.tsx         # Datacore script exporting `ComponentName`
 * ├── Script.css         # Styles scoped to the script
 * └── ComponentName.css  # Styles scoped to the component
 * ```
 * 
 * When `Script.tsx` is loaded, both `Script.css` and `ComponentName.css` are
 * injected into `ComponentName`.
 */
function ComponentWrapper({ component, scriptPath, children, ...props }) {
    const Component = component;

    /** Match $1 folder path and $2 script file basename */
    const pathRegex = /^((?:[^/\\<>:"|?*\x00-\x1f]+[/\\])*)([^/\\<>:"|?*\x00-\x1f]+)\.[jt]sx?$/;

    const scriptStylePath = useMemo(
        () => scriptPath.replace(pathRegex, "$1$2.css"),
        [scriptPath]
    );
    const componentStylePath = useMemo(
        () => scriptPath.replace(pathRegex, `$1${Component.name}.css`),
        [scriptPath, Component.name]
    
    );

    const [scriptStyle, setScriptStyle] = useState();
    const [componentStyle, setComponentStyle] = useState();

    useEffect(() => {
        app.vault.cachedRead(app.vault.getFileByPath(scriptStylePath))
            .then((fileContent: string) => setScriptStyle(fileContent));
        app.vault.cachedRead(app.vault.getFileByPath(componentStylePath))
            .then((fileContent: string) => setComponentStyle(fileContent));
    }, []);

    return (
        <LoggingErrorBoundary
            componentName={Component.name}
            path={scriptPath}
        >
            {scriptStyle && <style>{scriptStyle}</style>}
            {componentStyle && <style>{componentStyle}</style>}
            <Component {...props}>{children}</Component>
        </LoggingErrorBoundary>
    )
}

/**
 * Injects styles, logs error to console, and auto-refreshes when associated
 * script and stylesheets are modified.
 */
function AutoRefreshComponentWrapper({ component, scriptPath, children, ...props }) {
    const [Component, setComponent] = useState(() => component);
    const scriptRevision = dc.useFile(scriptPath)?.$revision;

    /** Match $1 folder path and $2 script file basename */
    const pathRegex = /^((?:[^/\\<>:"|?*\x00-\x1f]+[/\\])*)([^/\\<>:"|?*\x00-\x1f]+)\.[jt]sx?$/;

    const scriptStylePath = useMemo(
        () => scriptPath?.replace(pathRegex, "$1$2.css"),
        [scriptPath]
    );
    const componentStylePath = useMemo(
        () => scriptPath?.replace(pathRegex, `$1${Component.name}.css`),
        [scriptPath, Component.name]
    );
    const scriptStyleRevision = dc.useFile(scriptStylePath)?.$revision;
    const componentStyleRevision = dc.useFile(componentStylePath)?.$revision;

    const [scriptStyle, setScriptStyle] = useState();
    const [componentStyle, setComponentStyle] = useState();

    const [error, setError] = useState();

    // Reload Component on script update
    const firstUpdate = useRef(true);
    const [componentNotFound, setComponentNotFound] = useState(false);
    useEffect(async () => {
        // Skip first update because component is provided
        if (firstUpdate.current) {
            firstUpdate.current = false;
            return;
        }
        if (!scriptPath) return;
        const scriptObject = await dc.load(scriptPath);

        function findComponent(scriptObject) {
            if (typeof scriptObject === "function") {
                if (scriptObject.name === Component.name) {
                    setComponent(() => scriptObject);
                    return true;
                }
                return false;
            } else {
                for (const obj of Object.values(scriptObject)) {
                    if (findComponent(obj)) return true;
                }
                return false
            }
        }

        if (!findComponent(scriptObject)) {
            setComponentNotFound(true);
            console.error(`Component ${Component.name} not found in ${scriptPath}`);
            return;
        }

        // Component successfully reloaded
        setComponentNotFound(false);
        setError(() => null);
        new obsidian.Notice(`Component ${Component.name} reloaded from script:\n${scriptPath}`);
    }, [scriptRevision])

    // Reload script style
    useEffect(async () => {
        if (!scriptStylePath) return;
        const file = app.vault.getFileByPath(scriptStylePath)
        if (!file) return;
        const style = await app.vault.cachedRead(file);
        setScriptStyle(style);
    }, [scriptStyleRevision]);

    // Reload Component style
    useEffect(async () => {
        if (!componentStylePath) return;
        const file = app.vault.getFileByPath(componentStylePath);
        if (!file) return;
        const style = await app.vault.cachedRead(file);
        setComponentStyle(style);
    }, [componentStyleRevision]);

    if (!scriptPath) {
        console.error(
            new Error(`scriptPath is not provided to ${AutoRefreshComponentWrapper.name}`)
        );
    }

    return !scriptPath
    ? (
        <ErrorMessage
            title={<>Package <code>violet-datacore</code> error</>}
            message={<>
                <code>scriptPath</code> is not provided to <code>{AutoRefreshComponentWrapper.name}</code>
            </>}
        />
    )
    : (componentNotFound
        ? <ErrorMessage
                title={<>Package <code>violet-datacore</code> error</>}
                message={<>
                    Component <code>{Component.name}</code> not found in:
                    <br />
                    <code>{scriptPath}</code>
                </>}
            />
        : <ErrorContext.Provider value={{ error, setError }}>
            <LoggingErrorBoundary
                componentName={Component.name}
                path={scriptPath}
            >
                {scriptStyle && <style>{scriptStyle}</style>}
                {componentStyle && <style>{componentStyle}</style>}
                <Component {...props}>{children}</Component>
            </LoggingErrorBoundary>
        </ErrorContext.Provider>
    )
}

return { ComponentWrapper, AutoRefreshComponentWrapper };