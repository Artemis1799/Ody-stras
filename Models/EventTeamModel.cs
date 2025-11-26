using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace t5_back.Models;

public class EventTeam
{
    [Required]
    public Guid EventId { get; set; }
    
    [Required]
    public Guid TeamId { get; set; }
    
    [ForeignKey("EventId")]
    public Event? Event { get; set; }
    
    [ForeignKey("TeamId")]
    public Team? Team { get; set; }
}
