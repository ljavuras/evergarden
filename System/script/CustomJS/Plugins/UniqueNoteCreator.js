/**
 * A facade of Unique Note Creator API
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

class UniqueNoteCreator {
    plugin = app.internalPlugins.plugins['zk-prefixer'];
    settings = this.plugin.instance.options;
}
