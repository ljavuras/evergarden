const path = dc.path;

await cJS( ({ Datacore }) => { dc = Datacore.wrap(dc); } )

return function CurrentPath() {
    dc.useCurrentPath();
    return (
        <>
            <span>{path}</span><br/>
            <span>{dc.path}</span>
        </>
    )
}