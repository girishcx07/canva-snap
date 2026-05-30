"use client"

import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  PencilRulerIcon,
  PlayIcon,
  LayoutTemplateIcon,
  ImagesIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  PresentationIcon,
  FileTextIcon,
} from "lucide-react"

const data = {
  user: {
    name: "presenter",
    email: "you@deck.app",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    { title: "Dashboard", url: "/", icon: <LayoutDashboardIcon /> },
    { title: "Editor", url: "/editor", icon: <PencilRulerIcon /> },
    { title: "Present", url: "/present/sample", icon: <PlayIcon /> },
    { title: "Templates", url: "#", icon: <LayoutTemplateIcon /> },
    { title: "Assets", url: "#", icon: <ImagesIcon /> },
  ],
  navSecondary: [
    { title: "Settings", url: "#", icon: <Settings2Icon /> },
    { title: "Get Help", url: "#", icon: <CircleHelpIcon /> },
    { title: "Search", url: "#", icon: <SearchIcon /> },
  ],
  documents: [
    { name: "Welcome deck", url: "/editor", icon: <FileTextIcon /> },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/" />}
            >
              <PresentationIcon className="size-5!" />
              <span className="text-base font-semibold">Deck</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
