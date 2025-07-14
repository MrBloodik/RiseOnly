import { themeStore } from '@stores/theme'
import { observer } from 'mobx-react-lite'

interface SkeletonUiProps {
  children: React.ReactNode
}

export const SkeletonUi = observer(({
  children
}: SkeletonUiProps) => {
  const { currentTheme } = themeStore

  return (
    <></>
  )
})
