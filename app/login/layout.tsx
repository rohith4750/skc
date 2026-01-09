import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - SKC Caterers',
  description: 'Login to SKC Caterers Management System',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
