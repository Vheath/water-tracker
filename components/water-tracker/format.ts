const numberFormatter = new Intl.NumberFormat('ru-RU')
const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
})

export const formatMl = (value: number) => numberFormatter.format(value)
export const formatTime = (date: Date) => timeFormatter.format(date)
