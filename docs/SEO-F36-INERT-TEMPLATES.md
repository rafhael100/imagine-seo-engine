# SEO-F36 — Não aceitar conteúdo de templates inertes

Um documento pode conter markup preparado em `<template>` para instanciamento posterior pelo JavaScript. Esse markup não é, por si só, uma página publicada e não deve satisfazer a auditoria estática.

O auditor ignora subárvores `<template>` e suporta aninhamento. Ele não interpreta tokens `<template>` dentro de texto bruto de `<script>` ou `<style>`. Isso evita:
- títulos e metadados apenas em templates;
- títulos H1 e links de navegação que o navegador não montou;
- JSON-LD inerte contado como dados estruturados efetivos.

Limitação: continua uma heurística sem parser HTML5 nem execução de scripts. Validação final exige QA de navegador e HTTP de staging.
