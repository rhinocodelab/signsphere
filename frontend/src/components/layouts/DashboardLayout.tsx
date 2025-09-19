'use client'

import { ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
    children: ReactNode
    activeMenuItem: string
}

export default function DashboardLayout({ children, activeMenuItem }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="flex pt-16">
                <Sidebar activeMenuItem={activeMenuItem} />
                <main className="flex-1 p-6 min-h-screen pb-24 ml-64">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}