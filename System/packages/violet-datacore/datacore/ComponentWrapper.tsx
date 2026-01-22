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
 * path/to/package/
 * ├── datacore
 * |   ├── Script.tsx     # Datacore script exporting `Component`
 * |   ├── Script.css     # Styles scoped to the script
 * |   └── Component.css  # Styles scoped to the component
 * └── styles.css         # Styles scoped to the package
 * ```
 * 
 * When `Script.tsx` is loaded, `Component.css`, `Script.css` and
 * styles.css` are injected into `Component`.
 */
function ComponentWrapper({ pkg, component, scriptPath, children, ...props }) {
    const Component = component;

    /** Match $1 folder path and $2 script file basename */
    const pathRegex = /^((?:[^/\\<>:"|?*\x00-\x1f]+[/\\])*)([^/\\<>:"|?*\x00-\x1f]+)\.[jt]sx?$/;

    const packageStylePath = useMemo(
        () => pkg && `${pkg.path}/styles.css`,
        [pkg.path]
    );
    const scriptStylePath = useMemo(
        () => scriptPath.replace(pathRegex, "$1$2.css"),
        [scriptPath]
    );
    const componentStylePath = useMemo(
        () => scriptPath.replace(pathRegex, `$1${Component.name}.css`),
        [scriptPath, Component.name]
    
    );

    let packageStyleFile = app.vault.getFileByPath(packageStylePath);
    let scriptStyleFile = app.vault.getFileByPath(scriptStylePath);
    let componentStyleFile = scriptStylePath !== componentStylePath
        ? app.vault.getFileByPath(componentStylePath)
        : null;  // Component name === script name, skip inject style

    const [packageStyle, setPackageStyle] = useState();
    const [scriptStyle, setScriptStyle] = useState();
    const [componentStyle, setComponentStyle] = useState();

    useEffect(() => {
        app.vault.cachedRead(packageStyleFile)
            .then((content: string) => setPackageStyle(content))
            .catch((e) => {});
        app.vault.cachedRead(scriptStyleFile)
            .then((content: string) => setScriptStyle(content))
            .catch((e) => {});
        app.vault.cachedRead(componentStyleFile)
            .then((content: string) => setComponentStyle(content))
            .catch((e) => {});
    }, []);

    // Wait until styles are fully loaded
    const delayDisplay = (packageStyleFile && !(typeof packageStyle === "string"))
        || (scriptStyleFile && !(typeof scriptStyle === "string"))
        || (componentStyleFile && !(typeof componentStyle === "string"));

    return (
        <LoggingErrorBoundary
            componentName={Component.name}
            path={scriptPath}
        >
            {packageStyle && <style>{packageStyle}</style>}
            {scriptStyle && <style>{scriptStyle}</style>}
            {componentStyle && <style>{componentStyle}</style>}
            {!delayDisplay && <Component {...props}>{children}</Component>}
        </LoggingErrorBoundary>
    )
}

/**
 * Injects styles, logs error to console, and auto-refreshes when associated
 * script and stylesheets are modified.
 */
function AutoRefreshComponentWrapper({ pkg, component, scriptPath, children, ...props }) {
    const [Component, setComponent] = useState(() => component);
    const scriptRevision = dc.useFile(scriptPath)?.$revision;

    /** Match $1 folder path and $2 script file basename */
    const pathRegex = /^((?:[^/\\<>:"|?*\x00-\x1f]+[/\\])*)([^/\\<>:"|?*\x00-\x1f]+)\.[jt]sx?$/;

    const packageStylePath = useMemo(
        () => pkg && `${pkg.path}/styles.css`,
        [pkg]
    );
    const scriptStylePath = useMemo(
        () => scriptPath?.replace(pathRegex, "$1$2.css"),
        [scriptPath]
    );
    const componentStylePath = useMemo(
        () => scriptPath?.replace(pathRegex, `$1${Component.name}.css`),
        [scriptPath, Component.name]
    );
    const packageStyleRevision = dc.useFile(packageStylePath)?.$revision;
    const scriptStyleRevision = dc.useFile(scriptStylePath)?.$revision;
    const componentStyleRevision = dc.useFile(componentStylePath)?.$revision;

    const [packageStyle, setPackageStyle] = useState();
    const [scriptStyle, setScriptStyle] = useState();
    const [componentStyle, setComponentStyle] = useState();

    let packageStyleFile = app.vault.getFileByPath(packageStylePath);
    let scriptStyleFile = app.vault.getFileByPath(scriptStylePath);
    let componentStyleFile = scriptStylePath !== componentStylePath
        ? app.vault.getFileByPath(componentStylePath)
        : null;  // Component name === script name, skip inject style

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
            } else {
                for (const obj of Object.values(scriptObject)) {
                    if (findComponent(obj)) return true;
                }
            }
            return false;
        }

        if (!findComponent(scriptObject)) {
            setComponentNotFound(true);
            console.error(`Component ${Component.name} not found in ${scriptPath}`);
            return;
        }

        // Component successfully reloaded
        setComponentNotFound(false);
        setError(() => null);
        new obsidian.Notice(`violet-datacore:\nComponent ${Component.name} reloaded from script:\n${scriptPath}`);
    }, [scriptRevision])

    // Reload package style
    useEffect(async () => {
        if (!packageStyleFile) return;
        const content = await app.vault.cachedRead(packageStyleFile);
        setPackageStyle(content);
    }, [packageStyleRevision]);

    // Reload script style
    useEffect(async () => {
        if (!scriptStyleFile) return;
        const content = await app.vault.cachedRead(scriptStyleFile);
        setScriptStyle(content);
    }, [scriptStyleRevision]);

    // Reload Component style
    useEffect(async () => {
        if (!componentStyleFile) return;
        const content = await app.vault.cachedRead(componentStyleFile);
        setComponentStyle(content);
    }, [packageStyleRevision, scriptStyleRevision, componentStyleRevision]);

    if (!scriptPath) {
        console.error(
            new Error(`scriptPath is not provided to ${AutoRefreshComponentWrapper.name}`)
        );
    }

    // Wait until styles are fully loaded
    const delayDisplay = (packageStyleFile && !(typeof packageStyle === "string"))
        || (scriptStyleFile && !(typeof scriptStyle === "string"))
        || (componentStyleFile && !(typeof componentStyle === "string"));

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
                {packageStyle && <style>{packageStyle}</style>}
                {scriptStyle && <style>{scriptStyle}</style>}
                {componentStyle && <style>{componentStyle}</style>}
                {!delayDisplay && <Component {...props}>{children}</Component>}
            </LoggingErrorBoundary>
        </ErrorContext.Provider>
    )
}

return { ComponentWrapper, AutoRefreshComponentWrapper };