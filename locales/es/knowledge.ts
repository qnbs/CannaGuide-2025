// Spanish (Espanol) -- knowledge namespace
import { knowledgeView as en } from '../en/knowledge'

export const knowledgeView = {
    ...en,
    title: 'Centro de conocimiento',
    subtitle: 'Tu guia interactiva para un cultivo exitoso.',
    tabs: {
        mentor: 'Mentor IA',
        guide: 'Guia de cultivo',
        archive: 'Archivo del mentor',
        breeding: 'Laboratorio de cruce',
        sandbox: 'Sandbox',
    },
    hub: {
        selectPlant: 'Seleccionar planta',
        noPlants:
            'No hay plantas activas para consejos contextuales. Inicia un cultivo para comenzar!',
        todaysFocus: 'Enfoque de hoy para {{plantName}}',
    },
    aiMentor: {
        title: 'Mentor IA',
        plantContext: 'Chateando con el Mentor IA en el contexto de {{name}}',
        plantContextSubtitle:
            'Selecciona una planta para hacer preguntas contextuales y obtener consejos.',
        startChat: 'Iniciar chat',
        inputPlaceholder: 'Pregunta al mentor...',
        clearChat: 'Borrar chat',
        clearConfirm: 'Seguro que quieres borrar el historial de chat de esta planta?',
    },
    archive: {
        title: 'Archivo del mentor',
        empty: 'Aun no has archivado ninguna respuesta del mentor.',
        saveButton: 'Guardar en archivo',
        saveSuccess: 'Respuesta guardada en el archivo!',
        queryLabel: 'Tu consulta',
        editTitle: 'Editar respuesta',
    },
    breeding: {
        ...en.breeding,
        title: 'Laboratorio de cruce',
        description:
            'Cruza tus semillas recolectadas para crear variedades nuevas y unicas con caracteristicas combinadas.',
        collectedSeeds: 'Semillas recolectadas',
        noSeeds: 'Recolecta semillas de plantas listas para cosechar para comenzar a criar.',
        parentA: 'Padre A',
        parentB: 'Padre B',
        breedButton: 'Criar nueva variedad',
        resultsTitle: 'Resultado del cruce',
        newStrainName: 'Nombre de la nueva variedad',
        potentialTraits: 'Rasgos potenciales',
        saveStrain: 'Guardar variedad',
        breedingSuccess: 'Variedad "{{name}}" criada con exito! Se ha agregado a "Mis variedades".',
        splicingGenes: 'Empalmando genes...',
        flowering: 'Floracion',
        vigor: 'Vigor',
        resin: 'Resina',
        aroma: 'Aroma',
        diseaseResistance: 'Resistencia a enfermedades',
    },
}
