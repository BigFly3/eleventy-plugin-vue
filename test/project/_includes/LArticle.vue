<script setup>
import { useData } from '@mvsde/eleventy-plugin-vue'

import LBase from '@inc/LBase.vue'

const { content } = useData()
</script>

<template>
	<LBase>
		<div v-html="content" />
	</LBase>
</template>
