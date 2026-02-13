"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface Member {
  id: string;
  name: string;
  email: string;
}

interface MemberComboboxProps {
  members: Member[];
  value: string;
  onChange: (value: string) => void;
  name?: string;
}

export function MemberCombobox({
  members,
  value,
  onChange,
  name,
}: MemberComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedMember = members.find((m) => m.id === value);

  return (
    <>
      {name && <input type="hidden" name={name} value={value} />}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {selectedMember ? (
              <span className="truncate">
                {selectedMember.name}{" "}
                <span className="text-muted-foreground">
                  ({selectedMember.email})
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">
                Search for a member...
              </span>
            )}
            <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Type a name or email..." />
            <CommandList>
              <CommandEmpty>No member found.</CommandEmpty>
              <CommandGroup>
                {members.map((member) => (
                  <CommandItem
                    key={member.id}
                    value={`${member.name} ${member.email}`}
                    onSelect={() => {
                      onChange(member.id === value ? "" : member.id);
                      setOpen(false);
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 size-4",
                        value === member.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{member.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {member.email}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
