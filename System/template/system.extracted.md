<%*
/**
 * Note extracted by Note composer
 * 
 * This IS NOT a templater templater, but a Note composer template. Templater
 * however executes after Note composer is done.
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

const { Projects, Templater } = await cJS();

tp = Templater.wrap(tp);

/**
 * This template is triggered by Note composer, thus tp.config.template_file
 * won't be set correctly.
 */
tp.config.template_file = Templater.getFile("[[system.extracted]]");

// Apply main template (which runs template resolver)
tR += await tp.include("[[system.main]]");
-%>
{{content}}