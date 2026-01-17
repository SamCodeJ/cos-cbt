import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-900 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-slate-600",
          actionButton:
            "group-[.toast]:bg-amber-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-slate-200 group-[.toast]:text-slate-900",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
