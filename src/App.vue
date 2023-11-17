<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useFileDialog } from '@vueuse/core'
import readXlsxFile from 'read-excel-file'
import Fuse from 'fuse.js'
import { UseDraggable as Draggable } from '@vueuse/components'
import { VERSION } from './const'
import { computed } from 'vue';

interface Data {
  question: string
  options: string[]
  answer: string
}
type Answer = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

const answerToIndex: Record<Answer, number> = {
  'A': 0,
  'B': 1,
  'C': 2,
  'D': 3,
  'E': 4,
  'F': 5,
}

const optionsRef = ref<HTMLLabelElement[] | null>(null)
const nextButton = ref<HTMLButtonElement | null>(null)
const submitButton = ref<HTMLButtonElement | null>(null)
const autoSubmit = ref(true)
const submitDelay = ref(600)
const nextDelay = ref(100)
const optionList = computed(() => {
  return Array.from(optionsRef.value!).map((item) => {
    return item.innerText
  })
})

let shouldExit = false
let startFlag = ref(false)

const question = ref<string>('')
const data = ref<Data[]>([])
const dbAnswer = ref<string>('')
const windowRef = ref<HTMLElement | null>(null)
const handleRef = ref<HTMLDivElement | null>(null)
const innerWidth = window.innerWidth

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

  dbAnswer.value = result[0].item.answer
  const dbAnswerList: Answer[] = result[0].item.answer.split('') as Answer[]

  const dbRealAnswerList = convertOptionToAnswer(optionList.value, dbAnswerList)
  console.log(dbRealAnswerList);

  try {
    for (let item of dbRealAnswerList) {
      const fuse = new Fuse(optionList.value, {
        keys: ['value']
      });
      const result = fuse.search(item)
      if (!result) {
        nextButton.value!.click()
        return
      }
      await clickAnswer(result[0].refIndex)
    }
  }
  catch {
    nextButton.value!.click()
    return
  }

  if (autoSubmit.value) {
    submitButton.value!.click()
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve('')
      }, submitDelay.value);
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
    }, nextDelay.value);
  })
}

function convertOptionToAnswer(options: string[], option: Answer[]): string[] {
  const answerStringList: string[] = []
  for (let item of option) {
    answerStringList.push(options[answerToIndex[item]])
  }
  return answerStringList
}

async function clickAnswer(index: number) {
  try {
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
    <Draggable v-slot="{ x, y }" :prevent-default="true" :initial-value="{ x: innerWidth - 320, y: 80 }"
      :handle="handleRef" ref='windowRef' flex="~ col" rounded text-sm z-999999 fixed w-80 bg-gray-2 shadow-lg px-5>

      <div ref="handleRef" py-3 cursor-grab group>
        <div w="3/4" bg=" gray-300" transition-300 h-1.5 rounded-full mx-auto>
        </div>
      </div>

      <span font-bold text-lg mx-auto>自动答题脚本 v{{ VERSION }}</span>

      <div flex gap-2 my-5>
        <VBtn :disabled="data.length !== 0" @click="open()">{{ data.length === 0 ? '导入题库' : '已导入' }}</VBtn>
        <VBtn :disabled="startFlag" @click="start">开始答题</VBtn>
        <VBtn :disabled="!startFlag" :class="{ 'text-red': startFlag }" @click="stop">停止</VBtn>
      </div>

      <VSlider thumb-label step="100" min="100" max="2000" label="提交延迟" v-model="submitDelay" />
      <VSlider thumb-label step="50" min="100" max="500" label="切题延迟" v-model="nextDelay" />

      <VSwitch label="自动提交" v-model="autoSubmit" color="primary" />
    </Draggable>
  </Teleport>
</template>
