import { AddProject } from "@/components/dashboard/projects/add";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { api } from "@/utils/api";
import { Auth } from "@/server/api/services/auth";
import { User } from "@/server/api/services/user";

interface TabInfo {
  label: string;
  tabLabel?: string;
  description: string;
  index: string;
  isShow?: ({ rol, user }: { rol?: Auth["rol"]; user?: User }) => boolean;
}

export type TabState =
  | "projects"
  | "monitoring"
  | "settings"
  | "traefik"
  | "docker";

const tabMap: Record<TabState, TabInfo> = {
  projects: {
    label: "Projects",
    description: "Manage your projects",
    index: "/dashboard/projects",
  },
  monitoring: {
    label: "Monitoring",
    description: "Monitor your projects",
    index: "/dashboard/monitoring",
  },
  traefik: {
    label: "Traefik",
    tabLabel: "Traefik File System",
    description: "Manage your traefik",
    index: "/dashboard/traefik",
    isShow: ({ rol, user }) => {
      return Boolean(rol === "admin" || user?.canAccessToTraefikFiles);
    },
  },
  docker: {
    label: "Docker",
    description: "Manage your docker",
    index: "/dashboard/docker",
    isShow: ({ rol, user }) => {
      return Boolean(rol === "admin" || user?.canAccessToDocker);
    },
  },
  settings: {
    label: "Settings",
    description: "Manage your settings",
    index: "/dashboard/settings/server",
  },
};

interface Props {
  tab: TabState;
  children: React.ReactNode;
}

export const NavigationTabs = ({ tab, children }: Props) => {
  const router = useRouter();

  const { data } = api.auth.get.useQuery();
  const [hover, setHover] = useState<TabState | "">("");
  const [activeTab, setActiveTab] = useState<TabState>(tab);
  const { data: user } = api.user.byAuthId.useQuery(
    {
      authId: data?.id || "",
    },
    {
      enabled: !!data?.id && data?.rol === "user",
    }
  );

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  const activeTabInfo = useMemo(() => {
    return tabMap[activeTab];
  }, [activeTab]);

  return (
    <div className="gap-12">
      <header className="mb-6 flex w-full items-center gap-2 justify-between flex-wrap">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold lg:text-3xl">
            {activeTabInfo.label}
          </h1>
          <p className="lg:text-medium text-muted-foreground">
            {activeTabInfo.description}
          </p>
        </div>
        {tab === "projects" &&
          (data?.rol === "admin" || user?.canCreateProjects) && <AddProject />}
      </header>
      <div className="flex w-full justify-between gap-8 ">
        <Tabs
          value={activeTab}
          className="w-full"
          onValueChange={async (e) => {
            setActiveTab(e as TabState);
            router.push(tabMap[e as TabState].index);
          }}
        >
          {/* className="grid w-fit grid-cols-4 bg-transparent" */}
          <div className="flex flex-row items-center justify-between w-full gap-4 max-sm:overflow-x-auto border-b border-b-divider pb-1">
            <TabsList className="bg-transparent relative px-0">
              {Object.keys(tabMap).map((key) => {
                const tab = tabMap[key as TabState];
                if (tab.isShow && !tab.isShow?.({ rol: data?.rol, user })) {
                  return null;
                }
                return (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="relative py-2.5 md:px-5 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                    onMouseEnter={() => setHover(key as TabState)}
                    onMouseLeave={() => setHover("")}
                  >
                    <span className="relative z-[1] w-full">
                      {tab.tabLabel || tab.label}
                    </span>
                    {key === activeTab && (
                      <motion.div
                        layoutId="indicator"
                        transition={{
                          duration: 0.25,
                        }}
                        className="absolute -bottom-[5.5px] w-full"
                      >
                        <div className="h-0.5 bg-foreground rounded-t-md" />
                      </motion.div>
                    )}
                    {key === hover && (
                      <motion.div
                        layoutId="bg"
                        transition={{
                          duration: 0.25,
                        }}
                        className="absolute w-full h-full"
                      >
                        <div className="w-full h-full rounded-md bg-zinc-100 dark:bg-zinc-800" />
                      </motion.div>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="w-full">
            {children}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
