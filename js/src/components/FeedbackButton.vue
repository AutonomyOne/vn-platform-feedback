<template>
  <div>
    <!-- Floating trigger button -->
    <button class="pf-btn" @click="open = true">🐛 Feedback</button>

    <!-- Modal -->
    <div v-if="open" class="pf-overlay">
      <div class="pf-modal">
        <div class="pf-header">
          <h2>Report Feedback</h2>
          <button class="pf-close" @click="open = false">✕</button>
        </div>

        <!-- Honeypot -->
        <input v-model="honeypot" name="_hp" style="display:none" tabindex="-1" autocomplete="off" />

        <div class="pf-row">
          <button v-for="t in typeOptions" :key="t"
            :class="['pf-chip', { 'pf-chip--on': type === t }]"
            @click="type = t">
            {{ typeLabel[t] }}
          </button>
        </div>

        <div class="pf-row">
          <button v-for="sv in severityOptions" :key="sv"
            :class="['pf-chip', { 'pf-chip--on': severity === sv }]"
            @click="severity = sv">
            {{ sevLabel[sv] }}
          </button>
        </div>

        <input class="pf-input" v-model="title" placeholder="Short title" maxlength="120" />
        <textarea class="pf-input pf-textarea" v-model="description"
          placeholder="What happened? What did you expect? Steps to reproduce..." />

        <label class="pf-file-label">
          📎 Attach screenshot (optional)
          <input type="file" accept="image/*" style="display:none" @change="onFile" />
        </label>
        <span v-if="screenshot" class="pf-filename">{{ screenshot.name }}</span>

        <p v-if="error" class="pf-error">{{ error }}</p>
        <p v-if="submitted" class="pf-thanks">✅ Feedback received. Thank you.</p>

        <div class="pf-row" v-if="!submitted">
          <button class="pf-submit" @click="handleSubmit" :disabled="submitting">
            {{ submitting ? 'Sending…' : 'Submit' }}
          </button>
          <button class="pf-cancel" @click="open = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { submit } from '../integrations/vue.js'

const props = defineProps({
  user: { type: Object, default: () => ({}) },
})

const open        = ref(false)
const type        = ref('bug')
const severity    = ref('high')
const title       = ref('')
const description = ref('')
const screenshot  = ref(null)
const honeypot    = ref('')
const submitting  = ref(false)
const submitted   = ref(false)
const error       = ref(null)

const typeOptions     = ['bug', 'cosmetic', 'suggestion']
const severityOptions = ['critical', 'high', 'low']
const typeLabel  = { bug: '🐛 Bug', cosmetic: '🎨 Cosmetic', suggestion: '💡 Suggestion' }
const sevLabel   = { critical: '🔴 Critical', high: '🟠 High', low: '🟡 Low' }

function onFile(e) { screenshot.value = e.target.files?.[0] || null }

async function handleSubmit() {
  if (honeypot.value) return
  if (!title.value.trim() || !description.value.trim()) {
    error.value = 'Title and description are required.'
    return
  }
  submitting.value = true
  error.value = null
  try {
    submit({
      submissionType: 'user',
      type: type.value,
      severity: severity.value,
      title: title.value.trim().slice(0, 120),
      description: description.value.trim().slice(0, 5000),
      userId: props.user?.id,
      userEmail: props.user?.email,
      userRole: props.user?.role,
    })
    submitted.value = true
    setTimeout(() => { open.value = false; submitted.value = false }, 2000)
  } catch {
    error.value = 'Submission failed. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.pf-btn        { position:fixed; bottom:24px; right:24px; z-index:9998; background:#111; color:#fff; border:none; border-radius:24px; padding:10px 18px; font-size:13px; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,.2); }
.pf-overlay    { position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:9999; }
.pf-modal      { background:#fff; border-radius:12px; padding:28px; width:100%; max-width:480px; display:flex; flex-direction:column; gap:12px; box-shadow:0 20px 60px rgba(0,0,0,.3); }
.pf-header     { display:flex; justify-content:space-between; align-items:center; }
.pf-header h2  { font-size:18px; font-weight:700; margin:0; }
.pf-close      { background:none; border:none; font-size:18px; cursor:pointer; color:#666; }
.pf-row        { display:flex; gap:8px; flex-wrap:wrap; }
.pf-chip       { padding:6px 14px; border-radius:20px; border:1px solid #ddd; cursor:pointer; background:#f5f5f5; font-size:13px; }
.pf-chip--on   { background:#111; color:#fff; border-color:#111; }
.pf-input      { width:100%; padding:8px 12px; border-radius:8px; border:1px solid #ddd; font-size:14px; font-family:inherit; box-sizing:border-box; }
.pf-textarea   { height:100px; resize:vertical; }
.pf-file-label { font-size:13px; color:#555; cursor:pointer; }
.pf-filename   { font-size:12px; color:#888; }
.pf-error      { color:#c00; font-size:13px; margin:0; }
.pf-thanks     { font-size:16px; text-align:center; }
.pf-submit     { padding:10px 24px; border-radius:8px; background:#111; color:#fff; border:none; cursor:pointer; font-size:14px; }
.pf-cancel     { padding:10px 24px; border-radius:8px; background:#f5f5f5; color:#333; border:1px solid #ddd; cursor:pointer; font-size:14px; }
</style>
