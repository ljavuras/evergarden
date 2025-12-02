/**
 * Navigate backward through periodic notes, if it doesn't yet exist, create and
 * opens it.
 */

module.exports = async function periodic_navigateBackward({
    app,
    obsidian,
    quickAddApi,
    variables
}) {
    const { Periodic } = await cJS();
    
    Periodic.open('previous');
}