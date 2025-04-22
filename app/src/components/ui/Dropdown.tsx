"use client";

import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import Image from 'next/image';

export type DropdownOption = {
  id: string;
  name: string;
  symbol?: string;
  image?: string;
};

type DropdownProps = {
  options: DropdownOption[];
  selected: DropdownOption;
  onChange: (value: DropdownOption) => void;
  label?: string;
  className?: string;
};

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  selected,
  onChange,
  label,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1">
          {label}
        </label>
      )}
      <Listbox value={selected} onChange={onChange}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-card border border-border py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus:ring-2 focus:ring-solana-purple sm:text-sm">
            <div className="flex items-center">
              {selected.image && (
                <div className="h-5 w-5 mr-2 rounded-full relative overflow-hidden">
                  <Image
                    src={selected.image}
                    alt={selected.name}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                </div>
              )}
              <span className="block truncate font-medium">{selected.name}</span>
              {selected.symbol && (
                <span className="ml-1 text-muted-foreground">({selected.symbol})</span>
              )}
            </div>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-muted-foreground"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-card py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {options.map((option) => (
                <Listbox.Option
                  key={option.id}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-muted text-accent' : 'text-foreground'
                    }`
                  }
                  value={option}
                >
                  {({ selected }) => (
                    <>
                      <div className="flex items-center">
                        {option.image && (
                          <div className="h-5 w-5 mr-2 rounded-full relative overflow-hidden">
                            <Image
                              src={option.image}
                              alt={option.name}
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                          </div>
                        )}
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {option.name}
                        </span>
                        {option.symbol && (
                          <span className="ml-1 text-muted-foreground">
                            ({option.symbol})
                          </span>
                        )}
                      </div>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};

export default Dropdown;
