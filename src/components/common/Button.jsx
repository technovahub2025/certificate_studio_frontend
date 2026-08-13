export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const Component = props.as || 'button'
  const componentProps = { ...props }
  delete componentProps.as

  return (
    <Component className={`btn btn-${variant} ${className}`.trim()} {...componentProps}>
      {children}
    </Component>
  )
}
