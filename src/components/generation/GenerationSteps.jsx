const steps = ['Select template', 'Choose data file', 'Map fields', 'Generate output']

export default function GenerationSteps({ active = 1 }) {
  return (
    <ol className="generation-steps">
      {steps.map((step, index) => (
        <li key={step} className={index <= active ? 'active' : ''}>
          <span>{index + 1}</span>
          {step}
        </li>
      ))}
    </ol>
  )
}
