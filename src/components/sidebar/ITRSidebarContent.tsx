
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Check, Filter, ChevronRight, Search } from "lucide-react";
import { ClipboardIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { debounce } from "lodash";

const ITRSidebarContent: React.FC = () => {
  const { actividades, itrbItems, user, updateITRBStatus } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSistema, setSelectedSistema] = useState<string | null>(null);
  const [selectedSubsistema, setSelectedSubsistema] = useState<string | null>(null);
  
  // Check if user has permission to mark ITRs as completed
  const hasPermission = user && (user.role === "admin" || user.role === "tecnico");
  
  // Debounce search to improve performance
  const debouncedSearch = React.useMemo(
    () => debounce((value: string) => {
      setSearchTerm(value.toLowerCase());
    }, 300),
    []
  );
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };
  
  // Group activities by system and subsystem
  const sistemasMap = new Map();
  actividades.forEach(actividad => {
    if (!actividad.sistema) return;
    
    if (!sistemasMap.has(actividad.sistema)) {
      sistemasMap.set(actividad.sistema, new Map());
    }
    
    const subsistemas = sistemasMap.get(actividad.sistema);
    if (!subsistemas.has(actividad.subsistema)) {
      subsistemas.set(actividad.subsistema, []);
    }
    
    subsistemas.get(actividad.subsistema).push(actividad);
  });
  
  // Filter ITRs by search term or selection
  const filteredITRs = itrbItems.filter(itrb => {
    if (searchTerm && !itrb.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (selectedSistema || selectedSubsistema) {
      const actividad = actividades.find(a => a.id === itrb.actividadId);
      if (!actividad) return false;
      
      if (selectedSistema && actividad.sistema !== selectedSistema) return false;
      if (selectedSubsistema && actividad.subsistema !== selectedSubsistema) return false;
    }
    
    return true;
  });
  
  const markITRAsCompleted = async (itrId: string) => {
    try {
      await updateITRBStatus(itrId, "Completado");
      toast.success("ITR marcado como completado");
    } catch (error) {
      console.error("Error al marcar ITR como completado:", error);
      toast.error("Error al actualizar el estado del ITR");
    }
  };
  
  const canITRBeMarkedComplete = (itrb: any) => {
    return itrb.estado !== "Completado";
  };
  
  const getITRBadge = (estado: string) => {
    switch (estado) {
      case "Completado":
        return <Badge className="bg-green-500">Completado</Badge>;
      case "En curso":
        return <Badge className="bg-amber-500">En curso</Badge>;
      case "Vencido":
        return <Badge className="bg-red-500">Vencido</Badge>;
      default:
        return <Badge className="bg-gray-500">Sin estado</Badge>;
    }
  };

  // Process the data for display
  const sistemasArray = Array.from(sistemasMap.keys()).sort();
  
  if (!hasPermission) return null;
  
  return (
    <SheetContent side="left" className="w-80 sm:w-96">
      <SheetHeader>
        <SheetTitle className="flex items-center">
          <ClipboardIcon className="mr-2 h-5 w-5 text-blue-600" />
          Gestión de ITRs
        </SheetTitle>
        <SheetDescription>
          Selecciona un subsistema para marcar los ITRs completados
        </SheetDescription>
      </SheetHeader>
      <Separator className="my-4" />
      
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar ITR..."
          className="pl-8"
          onChange={handleSearch}
        />
      </div>
      
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="pr-4">
          {searchTerm ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                <Filter className="h-4 w-4 mr-1" /> 
                Resultados de búsqueda
              </h3>
              
              {filteredITRs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No se encontraron ITRs</p>
              ) : (
                filteredITRs.map(itrb => {
                  const actividad = actividades.find(a => a.id === itrb.actividadId);
                  
                  return (
                    <div key={itrb.id} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-md mb-2">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm">{itrb.descripcion}</span>
                        {getITRBadge(itrb.estado)}
                      </div>
                      
                      {actividad && (
                        <div className="text-xs text-muted-foreground mb-2">
                          {actividad.sistema} &gt; {actividad.subsistema}
                        </div>
                      )}
                      
                      {canITRBeMarkedComplete(itrb) && hasPermission && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-1 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                          onClick={() => markITRAsCompleted(itrb.id)}
                        >
                          <Check className="h-4 w-4 mr-1" /> Marcar como completado
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {sistemasArray.map((sistema) => (
                <AccordionItem key={sistema as string} value={sistema as string}>
                  <AccordionTrigger 
                    onClick={() => {
                      setSelectedSistema(selectedSistema === sistema ? null : sistema as string);
                    }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 px-2 rounded-md"
                  >
                    {sistema as string}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-4 border-l-2 border-slate-200 dark:border-slate-700 ml-2 space-y-2">
                      {sistemasMap.get(sistema) && Array.from(sistemasMap.get(sistema).keys()).map((subsistema) => {
                        // Filter ITRs for this subsystem
                        const subsistemaITRs = itrbItems.filter(itrb => {
                          const actividad = actividades.find(a => a.id === itrb.actividadId);
                          return actividad && actividad.sistema === sistema && actividad.subsistema === subsistema;
                        });
                        
                        const pendingCount = subsistemaITRs.filter(itrb => itrb.estado !== "Completado").length;
                        
                        return (
                          <div key={`${sistema}-${subsistema}`} className="py-1">
                            <button 
                              className={`flex items-center justify-between w-full text-left py-2 px-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                                selectedSubsistema === subsistema ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                              onClick={() => setSelectedSubsistema(selectedSubsistema === subsistema ? null : subsistema as string)}
                            >
                              <span>{subsistema ? String(subsistema) : 'Sin subsistema'}</span>
                              <div className="flex items-center">
                                {pendingCount > 0 && (
                                  <Badge variant="outline" className="mr-1 bg-amber-50 text-amber-700 border-amber-200">
                                    {pendingCount}
                                  </Badge>
                                )}
                                <ChevronRight className="h-4 w-4" />
                              </div>
                            </button>
                            
                            {/* Display ITRs if subsystem is selected */}
                            {selectedSubsistema === subsistema && (
                              <div className="mt-2 pl-2 space-y-2">
                                {subsistemaITRs.length === 0 ? (
                                  <p className="text-xs text-muted-foreground px-2">No hay ITRs para este subsistema</p>
                                ) : (
                                  subsistemaITRs.map(itrb => (
                                    <div key={itrb.id} className="bg-slate-50 dark:bg-slate-800 p-2 rounded-md">
                                      <div className="flex justify-between items-start">
                                        <span className="text-sm">{itrb.descripcion}</span>
                                        {getITRBadge(itrb.estado)}
                                      </div>
                                      {canITRBeMarkedComplete(itrb) && hasPermission && (
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="w-full mt-1 text-green-600 hover:bg-green-50 hover:text-green-700"
                                          onClick={() => markITRAsCompleted(itrb.id)}
                                        >
                                          <Check className="h-4 w-4 mr-1" /> Completar
                                        </Button>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </ScrollArea>
    </SheetContent>
  );
};

export default ITRSidebarContent;
