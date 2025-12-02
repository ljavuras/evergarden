/**
 * Opens today's quarterly note, if it doesn't yet exist, create one and opens it.
 */

module.exports = async function periodic_openDaily({
    app,
    obsidian,
    quickAddApi,
    variables
}) {
    const { Periodic } = await cJS();
    
    await Periodic.open('quarterly');
}