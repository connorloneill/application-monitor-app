import { NavLink } from 'react-router-dom'
import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import {
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline'
import { useTheme } from '../contexts/ThemeContext'

interface SidebarProps {
  isMobileOpen: boolean
  onMobileClose: () => void
  user?: { email?: string } | null
  onLogout: () => void
}

const navigation = [
  { name: 'Problem Reports', href: '/', icon: DocumentTextIcon },
  { name: 'Dev Tools', href: '/dev-tools', icon: WrenchScrewdriverIcon },
]

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Sidebar({ isMobileOpen, onMobileClose, user, onLogout }: SidebarProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={classNames(
          'bg-white dark:bg-gray-800 h-screen fixed left-0 top-0 z-40 w-60 transition-transform duration-300 ease-in-out shadow-lg flex flex-col',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <img
                src="/branding/logo_dark.png"
                alt="Andrew Morgan"
                className="dark:hidden h-10 w-auto"
              />
              <img
                src="/branding/logo_light.png"
                alt="Andrew Morgan"
                className="hidden dark:block h-10 w-auto"
              />
            </div>
            <button
              onClick={onMobileClose}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                classNames(
                  isActive
                    ? 'bg-brand-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                  'group flex items-center px-3 py-2 rounded-md transition-colors duration-150'
                )
              }
            >
              <item.icon className="flex-shrink-0 h-5 w-5 mr-3" aria-hidden="true" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Theme toggle */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={toggleTheme}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-150"
          >
            {theme === 'dark' ? (
              <SunIcon className="h-5 w-5 mr-3" />
            ) : (
              <MoonIcon className="h-5 w-5 mr-3" />
            )}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        {/* User section */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-2">
          <Menu as="div" className="relative">
            <Menu.Button className="w-full flex items-center space-x-3 rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.email ?? 'User'}
                </p>
              </div>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute bottom-full mb-2 left-0 right-0 mx-2 w-auto rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onLogout}
                      className={classNames(
                        active ? 'bg-gray-100 dark:bg-gray-700' : '',
                        'flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300'
                      )}
                    >
                      <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </>
  )
}
