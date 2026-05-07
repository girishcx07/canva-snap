'use client'

import { RefreshCwIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type JsonPlaceholderUser = {
  address: {
    city: string
  }
  company: {
    name: string
  }
  email: string
  name: string
  username: string
  website: string
}

type ClientApiState =
  | { status: 'loading' }
  | {
      fetchedAt: string
      status: 'ready'
      user: JsonPlaceholderUser
    }
  | { error: string; status: 'error' }

const users = [
  { label: 'User 1', value: '1' },
  { label: 'User 2', value: '2' },
  { label: 'User 3', value: '3' },
]

export function ClientApiPanel() {
  const [reloadToken, setReloadToken] = useState(0)
  const [selectedUser, setSelectedUser] = useState(users[0].value)
  const [state, setState] = useState<ClientApiState>({ status: 'loading' })

  useEffect(() => {
    let active = true

    async function loadUser() {
      setState({ status: 'loading' })

      try {
        const response = await fetch(
          `https://jsonplaceholder.typicode.com/users/${selectedUser}`,
        )

        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`)
        }

        const user = (await response.json()) as JsonPlaceholderUser

        if (active) {
          setState({
            fetchedAt: new Date().toISOString(),
            status: 'ready',
            user,
          })
        }
      } catch (error) {
        if (active) {
          setState({
            error:
              error instanceof Error ? error.message : 'Client fetch failed',
            status: 'error',
          })
        }
      }
    }

    loadUser()

    return () => {
      active = false
    }
  }, [reloadToken, selectedUser])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client island</CardTitle>
        <CardDescription>
          Browser fetch to JSONPlaceholder after hydration.
        </CardDescription>
        <CardAction>
          <Badge variant="outline">Client</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Tabs
          value={selectedUser}
          onValueChange={(value) => setSelectedUser(String(value))}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto">
              {users.map((user) => (
                <TabsTrigger key={user.value} value={user.value}>
                  {user.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReloadToken((value) => value + 1)}
            >
              <RefreshCwIcon data-icon="inline-start" />
              Refresh
            </Button>
          </div>

          {users.map((user) => (
            <TabsContent key={user.value} value={user.value} className="pt-4">
              <ClientUserState state={state} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

function ClientUserState({ state }: { state: ClientApiState }) {
  if (state.status === 'loading') {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <Alert variant="destructive">
        <AlertTitle>Client API error</AlertTitle>
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-3 text-sm sm:grid-cols-2">
      <div>
        <p className="font-medium">{state.user.name}</p>
        <p className="text-muted-foreground">@{state.user.username}</p>
      </div>
      <div>
        <p>{state.user.company.name}</p>
        <p className="text-muted-foreground">
          {state.user.address.city} - {state.user.website}
        </p>
      </div>
      <p className="text-muted-foreground sm:col-span-2">
        Loaded in the browser at {formatTime(state.fetchedAt)}
      </p>
    </div>
  )
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}
