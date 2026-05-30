const WELCOME_KEY = 'dental_show_dashboard_welcome'

export function markShowDashboardWelcome() {
  try {
    sessionStorage.setItem(WELCOME_KEY, '1')
  } catch {
    // ignore storage errors
  }
}

export function consumeShowDashboardWelcome(): boolean {
  try {
    if (sessionStorage.getItem(WELCOME_KEY) !== '1') return false
    sessionStorage.removeItem(WELCOME_KEY)
    return true
  } catch {
    return false
  }
}
