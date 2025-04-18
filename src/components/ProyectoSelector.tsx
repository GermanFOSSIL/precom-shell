
import React, { useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const ProyectoSelector: React.FC = () => {
  const { proyectos, filtros, setFiltros } = useAppContext();

  // Si no hay proyectos aún, mostrar un proyecto de ejemplo
  const proyectosDisponibles = proyectos.length > 0 ? proyectos : [
    {
      id: "proyecto-ejemplo",
      titulo: "Proyecto Vaca Muerta",
      descripcion: "Proyecto de ejemplo",
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    }
  ];

  // Set default project if none is selected
  useEffect(() => {
    if (!filtros.proyecto || filtros.proyecto === "undefined") {
      setFiltros({ ...filtros, proyecto: "todos" });
    }
  }, [filtros, setFiltros]);

  const handleProyectoChange = (proyectoId: string) => {
    setFiltros({ ...filtros, proyecto: proyectoId });
    
    const proyectoSeleccionado = proyectoId !== "todos" ? 
      proyectosDisponibles.find(p => p.id === proyectoId)?.titulo : 
      "Todos los proyectos";
      
    toast.success(`Proyecto seleccionado: ${proyectoSeleccionado || "Proyecto sin nombre"}`);
  };

  return (
    <Select
      value={filtros.proyecto || "todos"}
      onValueChange={handleProyectoChange}
    >
      <SelectTrigger className="w-full md:w-[300px] dark:bg-slate-800 dark:text-white dark:border-slate-600">
        <SelectValue placeholder="Seleccionar proyecto" />
      </SelectTrigger>
      <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
        <SelectItem value="todos">Todos los proyectos</SelectItem>
        {proyectosDisponibles.map((proyecto) => (
          <SelectItem key={proyecto.id} value={proyecto.id}>
            {proyecto.titulo || "Proyecto sin nombre"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ProyectoSelector;
