import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import type { WaterState } from '@/lib/water-state'
import { WaterTracker } from './water-tracker'

const AT = '2026-11-18T09:30:00.000Z'

const stateWithEntries: WaterState = {
  goal: 2000,
  entries: [
    { id: 'entry-1', amount: 250, at: AT },
    { id: 'entry-2', amount: 500, at: AT },
  ],
}

const emptyState: WaterState = { goal: 2000, entries: [] }

type JsonResponseInit = { ok?: boolean; status?: number }

const jsonResponse = (
  body: unknown,
  { ok = true, status = 200 }: JsonResponseInit = {},
) =>
  ({
    ok,
    status,
    json: async () => body,
  }) as unknown as Response

let fetchMock: Mock<typeof fetch>

beforeEach(() => {
  fetchMock = vi.fn<typeof fetch>()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('WaterTracker: отображение', () => {
  it('рендерит форму, начальные данные и список записей', () => {
    render(<WaterTracker initialState={stateWithEntries} />)

    expect(
      screen.getByRole('heading', { name: 'Трекер воды' }),
    ).toBeVisible()
    expect(screen.getByText(/Дневная норма/)).toHaveTextContent(
      /2\s*000\s*мл/,
    )
    expect(screen.getByPlaceholderText('Свой объем')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Добавить' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Добавить 250 мл' })).toBeVisible()

    const list = screen.getByRole('list')
    expect(within(list).getByText('250 мл')).toBeVisible()
    expect(within(list).getByText('500 мл')).toBeVisible()
    expect(screen.getByText('Записей: 2')).toBeVisible()

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '750',
    )
    // Начальное состояние приходит пропом, запросов при монтировании нет.
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('показывает заглушку, если записей нет', () => {
    render(<WaterTracker initialState={emptyState} />)

    expect(screen.getByText('Пока ничего не выпито')).toBeVisible()
    expect(screen.getByText('Добавьте первый стакан воды выше')).toBeVisible()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0',
    )
  })
})

describe('WaterTracker: валидация формы', () => {
  it.each([
    ['', /Введите объем в миллилитрах/],
    ['-250', /Используйте только цифры/],
    ['0', /Объем должен быть больше нуля/],
    ['1501', /не более 1500 мл/],
  ])(
    'не отправляет запрос и показывает ошибку для значения "%s"',
    async (value, message) => {
      const user = userEvent.setup()
      render(<WaterTracker initialState={emptyState} />)

      const input = screen.getByPlaceholderText('Свой объем')
      if (value) await user.type(input, value)
      await user.click(screen.getByRole('button', { name: 'Добавить' }))

      expect(screen.getByRole('alert')).toHaveTextContent(message)
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )
})

describe('WaterTracker: загрузка и защита от двойной отправки', () => {
  it('блокирует кнопку на время запроса и не отправляет второй', async () => {
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          // Искусственная задержка ответа сервера.
          setTimeout(
            () =>
              resolve(
                jsonResponse({ id: 'created-1', amount: 250, at: AT }),
              ),
            100,
          )
        }),
    )

    const user = userEvent.setup()
    render(<WaterTracker initialState={emptyState} />)

    const input = screen.getByPlaceholderText('Свой объем')
    const submit = screen.getByRole('button', { name: 'Добавить' })

    await user.type(input, '250')
    await user.click(submit)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(submit).toBeDisabled()
    expect(submit).toHaveAttribute('aria-busy', 'true')
    expect(input).toBeDisabled()

    // Повторный клик пользователя по заблокированной кнопке.
    await user.click(submit)
    // Даже «принудительный» клик не должен обойти защиту isLoading.
    fireEvent.click(submit)

    expect(fetchMock).toHaveBeenCalledTimes(1)

    await waitFor(
      () =>
        expect(
          screen.getByRole('button', { name: 'Добавить' }),
        ).toBeEnabled(),
      { timeout: 2000 },
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(within(screen.getByRole('list')).getByText('250 мл')).toBeVisible()
  })
})

describe('WaterTracker: успешная отправка', () => {
  it('добавляет новую запись в список и очищает поле ввода', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 'created-1', amount: 250, at: AT }),
    )

    const user = userEvent.setup()
    render(<WaterTracker initialState={emptyState} />)

    const input = screen.getByPlaceholderText('Свой объем')
    await user.type(input, '250')
    await user.click(screen.getByRole('button', { name: 'Добавить' }))

    expect(await screen.findByText('250 мл')).toBeVisible()

    const list = screen.getByRole('list')
    expect(within(list).getByText('250 мл')).toBeVisible()
    expect(within(list).queryByText(/Сохраняем/)).not.toBeInTheDocument()

    expect(input).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Добавить' })).toBeEnabled()
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '250',
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/water',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ amount: 250, source: 'custom' }),
      }),
    )
  })
})

describe('WaterTracker: ошибка сервера', () => {
  it('показывает сообщение об ошибке и разрешает повторную попытку', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { error: 'Сервер недоступен. Попробуйте позже.' },
        { ok: false, status: 500 },
      ),
    )

    const user = userEvent.setup()
    render(<WaterTracker initialState={emptyState} />)

    const input = screen.getByPlaceholderText('Свой объем')
    const submit = screen.getByRole('button', { name: 'Добавить' })

    await user.type(input, '250')
    await user.click(submit)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Сервер недоступен. Попробуйте позже.',
    )
    await waitFor(() => expect(submit).toBeEnabled())
    expect(input).toBeEnabled()
    expect(screen.getByText('Пока ничего не выпито')).toBeVisible()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // Форма очищает поле после неудачной попытки, поэтому вводим снова.
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 'retry-1', amount: 250, at: AT }),
    )
    await user.type(input, '250')
    await user.click(submit)

    expect(await screen.findByText('250 мл')).toBeVisible()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('показывает сообщение при сетевой ошибке fetch', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const user = userEvent.setup()
    render(<WaterTracker initialState={emptyState} />)

    const submit = screen.getByRole('button', { name: 'Добавить' })
    await user.type(screen.getByPlaceholderText('Свой объем'), '250')
    await user.click(submit)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Нет соединения с сервером.',
    )
    await waitFor(() => expect(submit).toBeEnabled())
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
