{# This is a Nunjucks template #}
{% if is_new_article %}
# {{title}}

## Metadata
{% if author %}- Author: [{{author}}]({{authorUrl}}){% endif %}
- Title: {{title}}
{% if url %}- Reference: {{url}}{% endif %}
- Category: #article
{% endif %}

{%- if is_new_article %}
## Page Notes
{% for page_note in page_notes -%}
{{page_note.annotation}}
{%- if page_note.tags | length %}
Tags: {% for tag in page_note.tags -%} #{{tag | replace(" ", "-")+" "}}{%- endfor %}
{% endif %}
{% endfor %}
{%- endif -%}

{%- if is_new_article -%}
## Highlights
{% for highlight in highlights -%}
- {{highlight.text}} — [Updated on {{highlight.updated}}]({{highlight.incontext}})
{%- if 'Private' != highlight.group %} — Group: #{{highlight.group | replace(" ", "-")}}{% endif %}
{% if highlight.tags | length %}    - Tags: {% for tag in highlight.tags %} #{{tag | replace(" ", "-")+" "}}{% endfor %}
{% endif -%}
{% if highlight.annotation %}    - Annotation: {{highlight.annotation}}{% endif %}
{% endfor %}
{% endif %}
