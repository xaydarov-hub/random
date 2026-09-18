import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
const styles=cva('button',{variants:{variant:{primary:'button-primary',secondary:'button-secondary',ghost:'button-ghost',danger:'button-danger'}},defaultVariants:{variant:'primary'}});
export function Button({asChild=false,variant,className,...props}:ButtonHTMLAttributes<HTMLButtonElement>&VariantProps<typeof styles>&{asChild?:boolean}){const Component=asChild?Slot:'button';return <Component className={clsx(styles({variant}),className)} {...props}/>;}
