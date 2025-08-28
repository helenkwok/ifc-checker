import * as THREE from 'three'
import * as OBC from '@thatopen/components'
import * as fs from 'fs'
import * as path from 'path'
import { promptUser } from './utils.js'

export const checkIFC = async () => {
  const selectedFiles = await promptUser()
  if (!selectedFiles) return

  const ifc = fs.readFileSync(selectedFiles.ifcPath)

  const ids = fs.readFileSync(selectedFiles.idsPath, 'utf8')

  const components = new OBC.Components()

  const ifcLoader = components.get(OBC.IfcLoader)
  const ifcBuffer = new Uint8Array(ifc.buffer)
  const model = await ifcLoader.load(ifcBuffer)

  const idsSpecs = components.get(OBC.IDSSpecifications)

  const specs = idsSpecs.load(ids)

  const topics = components.get(OBC.BCFTopics)
  topics.setup()

  const world = components.get(OBC.Worlds).create()
  const viewpoints = components.get(OBC.Viewpoints)

  for (const [index, spec] of specs.entries()) {
    const result = await spec.test(model)

    const failingGuids = result
      .filter((check) => !check.pass)
      .map((check) => check.guid)
      .filter((guid) => guid)

    const topic = topics.create({
      title: spec.name,
      description: spec.description,
      creationAuthor: selectedFiles.creationAuthor,
    })

    const viewpoint = new OBC.Viewpoint(components, world, { setCamera: false })
    viewpoints.list.set(viewpoint.guid, viewpoint)

    viewpoint.selectionComponents.add(...failingGuids)
    const comment = `${topic.description}: Found ${failingGuids.length} failing`
    topic.createComment(comment)

    console.log(comment)

    viewpoint.componentColors.set(new THREE.Color('red'), failingGuids)

    topic.viewpoints.add(viewpoint.guid)

    const bcfBlob = await topics.export([topic])

    const bcfData = Buffer.from(await bcfBlob.arrayBuffer())
    const exportPath = path.join(
      process.cwd(),
      `${selectedFiles.ifcFile}-${topic.creationDate.getTime()}-result-${index + 1}.bcf`
    )
    fs.writeFileSync(exportPath, bcfData)
  }
}
