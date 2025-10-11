/**
 * アプリケーション全体で使用するカラートークンの定義
 * useColorStyles.ts と main.tsx で共有される
 */

export const COLOR_TOKENS = {
  light: {
    text: {
      primary: 'gray.800',
      secondary: 'gray.600',
      muted: 'gray.500',
    },
    bg: {
      primary: 'white',
      secondary: 'gray.50',
    },
    border: {
      default: 'gray.200',
      input: 'gray.300',
    },
    accent: {
      blue: {
        bg: 'blue.100',
        text: 'blue.800',
        label: 'blue.600',
        border: 'blue.200',
        button: 'blue.500',
        buttonHover: 'blue.600',
        focus: 'blue.500',
        cardBg: 'blue.50',
        cardBorder: 'blue.200',
        cardHover: 'blue.100',
        linkColor: '#3182CE',
      },
      red: {
        bg: 'red.50',
        text: 'red.600',
        border: 'red.200',
        borderHover: 'red.300',
      },
      orange: {
        bg: 'orange.50',
        text: 'orange.600',
        label: 'orange.700',
        border: 'orange.200',
        borderHover: 'orange.400',
      }
    }
  },
  dark: {
    text: {
      primary: 'gray.100',
      secondary: 'gray.300',
      muted: 'gray.400',
    },
    bg: {
      primary: 'gray.800',
      secondary: 'gray.700',
    },
    border: {
      default: 'gray.600',
      input: 'gray.600',
    },
    accent: {
      blue: {
        bg: 'blue.800',
        text: 'blue.200',
        label: 'blue.300',
        border: 'blue.600',
        button: 'blue.600',
        buttonHover: 'blue.500',
        focus: 'blue.400',
        cardBg: 'blue.900',
        cardBorder: 'blue.700',
        cardHover: 'blue.800',
        linkColor: '#90CDF4',
      },
      red: {
        bg: 'red.900',
        text: 'red.300',
        border: 'red.600',
        borderHover: 'red.500',
      },
      orange: {
        bg: 'orange.900',
        text: 'orange.300',
        label: 'orange.200',
        border: 'orange.600',
        borderHover: 'orange.500',
      }
    }
  }
} as const