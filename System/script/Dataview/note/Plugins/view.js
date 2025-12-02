/**
 * Plugin overview build upon Dataview plugin
 * 
 * @author ljavuras <ljavuras.py@gmail.com>
 */

// dv, input

let obsidian;
try {
    obsidian = require('obsidian');  // enabled by fix require modules plugin
} catch {
    obsidian = input.obsidian     // provide obsidian api through `dv.view()`
            || (await cJS()).obsidian  // get obsidian api from CustomJS plugin
            // get obsidian api from templater plugin
            || app.plugins.plugins['templater-obsidian'].templater.current_functions_object.obsidian
            ;
}

let pluginsConfig = input || {};
if (!pluginsConfig.plugins) { pluginsConfig.plugins = {}; }
if (!Array.isArray(pluginsConfig.groups)) { pluginsConfig.groups = []; }

function pluginsConfig_getDescription(pluginId) {
    return pluginsConfig.plugins?.[pluginId]?.description;
}

function pluginsConfig_writeDescription(pluginId, description) {
    pluginsConfig.plugins[pluginId]?
        pluginsConfig.plugins[pluginId].description = description
      : pluginsConfig.plugins[pluginId] = { description: description };

      pluginsConfig_save();
}
    
// TODO: Save before dv component rerenders itself
async function pluginsConfig_save() {
    let currentFile = dv.current();
    let currentFileContent = await app.vault.read(currentFile);
    
    app.vault.modify(
        currentFile,
        currentFileContent.replace(
            /(dv\.view\("[^"]+\"),?.*(\);)/,
            `$1, ${JSON.stringify(pluginsConfig)}$2`
        )
    );
}

const containerEl = dv.container;

const pluginsSummaryEl = containerEl.createEl("div", {
    text: `${app.plugins.enabledPlugins.size} enabled/${Object.keys(app.plugins.manifests).length} installed`
})

const pluginsListEl = containerEl.createEl("div", { cls: "plugins__list" });
const pluginsManifests = Object.entries(app.plugins.manifests)
    .map(([pluginId, pluginManifest]) => pluginManifest)
    .sort((manifest_a, manifest_b) => {
        return manifest_a.name.localeCompare(manifest_b.name);
    });
for (const pluginManifest of pluginsManifests) {
    let pluginListItemEl = pluginsListEl.createEl("div", { cls: "plugins__listItem" });
    
    let pluginInfoEl = pluginListItemEl.createEl("div",  { cls: "plugins__listItem__info" });
    let pluginInfoNameEl = pluginInfoEl.createEl("a", {
            attr: {
                'data-tool-tip-position': "top",
                'aria-label': `obsidian://show-plugin?id=${pluginManifest.id}`,
                rel: "noopener nofollow",
                target: "_blank",
                href: `obsidian://show-plugin?id=${pluginManifest.id}`
            },
            text: pluginManifest.name,
            cls: "plugins__listItem__info__name"
        });
    pluginInfoNameEl.onclick = (event) => { event.stopPropagation(); }
    obsidian.setTooltip(pluginInfoNameEl, "Plugin Page", { delay: 1000 });
    pluginInfoEl.createEl("span", { text: pluginManifest.id, cls: "plugins__listItem__info__id" });
    let pluginDescEl = pluginInfoEl.createEl("div", {
        cls: "plugins__listItem__info__description",
        text: pluginsConfig_getDescription(pluginManifest.id),
    });
    let pluginDescInputEl = pluginInfoEl.createEl("textarea", {
        cls: "plugins__listItem__info__description hide",
        text: pluginsConfig_getDescription(pluginManifest.id),
        attr: { rows: 1, placeholder: "Custom description" }
    });
    pluginInfoEl.onclick = (event) => {
        pluginDescEl.classList.add("hide");
        pluginDescInputEl.classList.remove("hide");
        pluginDescInputEl.focus();
        pluginDescInputEl.selectionStart = pluginDescInputEl.value.length;
    };
    obsidian.setTooltip(pluginInfoEl, "Edit plugin description", { delay: 1000 });
    pluginDescInputEl.submit = () => {
        pluginDescEl.innerText = pluginDescInputEl.value;
        pluginDescEl.classList.remove("hide");
        pluginDescInputEl.classList.add("hide");
        pluginDescInputEl.blur();

        pluginsConfig_writeDescription(pluginManifest.id, pluginDescInputEl.value);
    };
    pluginDescInputEl.onblur = pluginDescInputEl.submit;
    pluginDescInputEl.onkeydown = (event) => { if (event.key == "Enter") { pluginDescInputEl.submit(); } }

    let pluginSettingEl = pluginListItemEl.createEl("div", { cls: "plugins__listItem__control" });
    if (app.setting.pluginTabs.find((tab) => tab.id == pluginManifest.id)) {
        let pluginOptionEl = pluginSettingEl.createEl("div", { cls: "clickable-icon" });
        obsidian.setIcon(pluginOptionEl, "settings");
        obsidian.setTooltip(pluginOptionEl, "Options", { delay: 1000 });
        pluginOptionEl.onclick = (event) => {
            app.setting.open();
            app.setting.openTabById(pluginManifest.id);
        };
    }
    new obsidian.ToggleComponent(pluginSettingEl)
        .setValue(app.plugins.enabledPlugins.has(pluginManifest.id))
        .onChange((toggleValue) => {
            toggleValue? app.plugins.enablePluginAndSave(pluginManifest.id)
                       : app.plugins.disablePluginAndSave(pluginManifest.id);
        });
}