import * as fs from 'fs'
import * as path from 'path'
import { input, select } from '@inquirer/prompts'


const getFiles = (extension) => {
  return fs
    .readdirSync(process.cwd())
    .filter(
      (file) => path.extname(file).toLowerCase() === extension.toLowerCase()
    )
}

export const promptUser = async () => {
  const ifcFiles = getFiles('.ifc')
  const idsFiles = getFiles('.ids')

  if (ifcFiles.length === 0 || idsFiles.length === 0) {
    console.log('No IFC or IDF files found in the current directory')
    return
  }

  const ifcFile = await select({
    message: 'Select the IFC file:',
    choices: ifcFiles,
  })
  const idsFile = await select({
    message: 'Select the IDS file:',
    choices: idsFiles,
  })

  const ifcPath = path.join(process.cwd(), ifcFile)
  const idsPath = path.join(process.cwd(), idsFile)

  const creationAuthor = await input({
    message: 'Enter the creation author:',
    default: 'john.doe@example.com',
  })

  return { ifcFile, ifcPath, idsPath, creationAuthor }
}