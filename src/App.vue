<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useFileDialog } from '@vueuse/core'
import readXlsxFile from 'read-excel-file'
import Fuse from 'fuse.js'
import { useDraggable } from '@vueuse/core'

interface Data {
  question: string
  options: string[]
  answer: string
}
type Answer = 'A' | 'B' | 'C' | 'D' | 'E'

const answerToIndex: Record<Answer, number> = {
  'A': 0,
  'B': 1,
  'C': 2,
  'D': 3,
  'E': 4
}

const optionsRef = ref<HTMLLabelElement[] | null>(null)
const nextButton = ref<HTMLButtonElement | null>(null)
const submitButton = ref<HTMLButtonElement | null>(null)
const autoSubmit = ref(true)
let shouldExit = false
let startFlag = ref(false)

const question = ref<string>('')
const data = ref<Data[]>([])
const answer = ref<string>('')
const windowRef = ref<HTMLElement | null>(null)
const { style } = useDraggable(windowRef, {
  initialValue: { x: 960, y: 0 },
})

const { open, onChange } = useFileDialog({
  accept: 'xlsx/*', // Set to accept only image files
  directory: false,
  multiple: false// Select directories instead of files if set true
})

onChange((files: any) => {
  data.value = []
  const file = files[0]
  readXlsxFile(file).then((rows) => {
    rows.forEach((row, index) => {
      if (index === 0) return
      // row 1,5,6-9
      const question = row[1].toString()
      const answer = row[5].toString()
      const options: string[] = []
      row.slice(6, 10).forEach((cel) => {
        if (cel) {
          options.push(cel.toString())
        }
      })
      data.value.push({
        question,
        options,
        answer
      })
    })
  })
})

function getQO() {
  optionsRef.value = document.querySelectorAll('.options-box') as unknown as HTMLLabelElement[]
  nextButton.value = document.querySelectorAll('.sjy-button--primary')[1] as unknown as HTMLButtonElement
  submitButton.value = document.querySelectorAll('.sjy-button--default')[1] as unknown as HTMLButtonElement
  const q = document.querySelector('.display-latex')

  const qText = (q as any).innerText
  question.value = qText
}

async function getAnswer() {

  if (data.value.length === 0) {
    alert('请先导入题库')
    shouldExit = true
    return
  }
  getQO()
  const fuse = new Fuse(data.value, {
    keys: ['question']
  });
  const result = fuse.search(question.value)
  if (result.length === 0) {
    nextButton.value!.click()
    return
  }
  answer.value = result[0].item.answer
  const answerList: Answer[] = result[0].item.answer.split('') as Answer[]
  for (let item of answerList) {
    await clickAnswer(item)
  }

  if (autoSubmit.value) {
    submitButton.value!.click()
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve('')
      }, 300);
    })
  }

  if (!nextButton.value) {
    stop()
  } else {
    nextButton.value!.click()
  }
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve('')
    }, 100);
  })
}

async function clickAnswer(answer: Answer) {
  try {
    const index = answerToIndex[answer]
    optionsRef.value![index].click()
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve('')
      }, 10);
    })
  }
  catch (e) {
    console.log(e);
  }
}

async function start() {
  console.log('start');
  startFlag.value = true
  shouldExit = false
  while (!shouldExit) {
    await getAnswer()
  }
}

function stop() {
  shouldExit = true
  startFlag.value = false
  console.log('stop');
}
</script>

<template>
  <Teleport to="body">
    <div ref='windowRef' :style="style" flex="~ col" justify-between text-sm z-999999 fixed w-80 h-40 bg-gray700 p-5
      text-light>
      <span font-bold text-lg>自动答题脚本 v1.0</span>
      <div flex gap-2>
        <button :disabled="data.length !== 0" @click="open()">{{ data.length === 0 ? '导入题库' : '已导入' }}</button>
        <button :disabled="startFlag" @click="start">开始答题</button>
        <button :disabled="!startFlag" :class="{ 'text-red': startFlag }" @click="stop">停止</button>
      </div>

      <div flex>
        <input v-model="autoSubmit" type="checkbox" />
        <p>自动提交</p>
      </div>
    </div>
  </Teleport>
</template>
